import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ─── Models ───────────────────────────────────────────────────────────────────

export interface ExpenseRecord {
  id: string;
  date: string;
  amount: number;
  description: string;
}

export interface Site {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  expenses: ExpenseRecord[];
}

export interface AdvanceRecord {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  note?: string;
  type?: "payment" | "settlement" | "carry_forward";
}

export type LabourStatus = "active" | "left";

export interface Labour {
  id: string;
  siteId: string;
  name: string;
  phone?: string;
  workType?: string;
  ratePerDay: number;
  status: LabourStatus;
  createdAt: string;
  notes?: string;
  totalHajri: number;
  hajriNote?: string;
  advances: AdvanceRecord[];
  payments: PaymentRecord[];
}

export interface AuthUser {
  phone: string;
  loggedInAt: string;
}

export interface LabourStats {
  daysWorked: number;
  totalEarned: number;
  totalAdvance: number;
  totalPaid: number;
  remainingBalance: number;
  isAdvancePending: boolean;
  isLeftWithAdvance: boolean;
}

// ─── Context Value ─────────────────────────────────────────────────────────────

interface AppContextValue {
  user: AuthUser | null;
  labourers: Labour[];
  sites: Site[];
  isLoading: boolean;

  // Auth
  login: (phone: string) => void;
  logout: () => void;

  // Sites
  addSite: (name: string, color: string) => void;
  updateSite: (id: string, data: Partial<Pick<Site, "name" | "color">>) => void;
  deleteSite: (id: string) => void;
  getSite: (id: string) => Site | undefined;
  addSiteExpense: (siteId: string, amount: number, description: string) => void;
  deleteSiteExpense: (siteId: string, expenseId: string) => void;

  // Labour CRUD
  addLabour: (data: Omit<Labour, "id" | "createdAt" | "advances" | "payments">) => void;
  updateLabour: (id: string, data: Partial<Labour>) => void;
  deleteLabour: (id: string) => void;
  getLabour: (id: string) => Labour | undefined;
  getLaboursForSite: (siteId: string) => Labour[];

  // Hajri
  setHajri: (labourId: string, total: number, note?: string) => void;

  // Advances
  addAdvance: (labourId: string, amount: number, note?: string) => void;
  deleteAdvance: (labourId: string, advanceId: string) => void;

  // Settlement (Smart Auto-Reset)
  settleAndReset: (labourId: string, note?: string) => "case1" | "case2";

  // Calculations
  calcStats: (labour: Labour) => LabourStats;

  // Site Stats
  calcSiteStats: (siteId: string) => {
    labourCost: number;
    totalAdvance: number;
    otherExpenses: number;
    netCost: number;
    activeCount: number;
    alertCount: number;
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  USER: "@labour_app_user",
  LABOURERS: "@labour_app_labourers",
  SITES: "@labour_app_sites",
};

const DEFAULT_SITE_ID = "default_site";
const SITE_COLORS = ["#E85D04", "#2563EB", "#16A34A", "#9333EA", "#DC2626", "#0891B2", "#D97706"];

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [labourers, setLabourers] = useState<Labour[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from storage + migrate old data
  useEffect(() => {
    (async () => {
      try {
        const [userRaw, laboursRaw, sitesRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.LABOURERS),
          AsyncStorage.getItem(STORAGE_KEYS.SITES),
        ]);

        if (userRaw) setUser(JSON.parse(userRaw));

        let parsedSites: Site[] = sitesRaw ? JSON.parse(sitesRaw) : [];
        let parsedLabours: Labour[] = [];

        if (laboursRaw) {
          const raw: any[] = JSON.parse(laboursRaw);
          // Migrate: add siteId, remove attendance array, ensure totalHajri
          const needsDefaultSite = raw.some((l) => !l.siteId);
          if (needsDefaultSite && !parsedSites.find((s) => s.id === DEFAULT_SITE_ID)) {
            parsedSites = [
              {
                id: DEFAULT_SITE_ID,
                name: "Default Site",
                color: SITE_COLORS[0],
                createdAt: new Date().toISOString(),
                expenses: [],
              },
              ...parsedSites,
            ];
          }
          parsedLabours = raw.map((l) => ({
            ...l,
            siteId: l.siteId ?? DEFAULT_SITE_ID,
            totalHajri: l.totalHajri ?? (l.attendance ? l.attendance.filter((a: any) => a.present).length : 0),
            advances: l.advances ?? [],
            payments: l.payments ?? [],
            noteHistory: undefined, // clean up old field
          }));
        }

        setSites(parsedSites);
        setLabourers(parsedLabours);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Persistence helpers ──────────────────────────────────────────────────────

  const saveLabourers = useCallback(async (list: Labour[]) => {
    setLabourers(list);
    await AsyncStorage.setItem(STORAGE_KEYS.LABOURERS, JSON.stringify(list));
  }, []);

  const saveSites = useCallback(async (list: Site[]) => {
    setSites(list);
    await AsyncStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(list));
  }, []);

  // ── Auth ─────────────────────────────────────────────────────────────────────

  const login = useCallback(async (phone: string) => {
    const u: AuthUser = { phone, loggedInAt: new Date().toISOString() };
    setUser(u);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  // ── Sites ────────────────────────────────────────────────────────────────────

  const addSite = useCallback(
    (name: string, color: string) => {
      const site: Site = {
        id: generateId(),
        name,
        color,
        createdAt: new Date().toISOString(),
        expenses: [],
      };
      saveSites([...sites, site]);
    },
    [sites, saveSites]
  );

  const updateSite = useCallback(
    (id: string, data: Partial<Pick<Site, "name" | "color">>) => {
      saveSites(sites.map((s) => (s.id === id ? { ...s, ...data } : s)));
    },
    [sites, saveSites]
  );

  const deleteSite = useCallback(
    (id: string) => {
      saveSites(sites.filter((s) => s.id !== id));
      saveLabourers(labourers.filter((l) => l.siteId !== id));
    },
    [sites, labourers, saveSites, saveLabourers]
  );

  const getSite = useCallback(
    (id: string) => sites.find((s) => s.id === id),
    [sites]
  );

  const addSiteExpense = useCallback(
    (siteId: string, amount: number, description: string) => {
      const exp: ExpenseRecord = {
        id: generateId(),
        date: new Date().toISOString(),
        amount,
        description,
      };
      saveSites(
        sites.map((s) =>
          s.id === siteId ? { ...s, expenses: [...s.expenses, exp] } : s
        )
      );
    },
    [sites, saveSites]
  );

  const deleteSiteExpense = useCallback(
    (siteId: string, expenseId: string) => {
      saveSites(
        sites.map((s) =>
          s.id === siteId
            ? { ...s, expenses: s.expenses.filter((e) => e.id !== expenseId) }
            : s
        )
      );
    },
    [sites, saveSites]
  );

  // ── Labour CRUD ───────────────────────────────────────────────────────────────

  const addLabour = useCallback(
    (data: Omit<Labour, "id" | "createdAt" | "advances" | "payments">) => {
      const newLabour: Labour = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        advances: [],
        payments: [],
      };
      saveLabourers([...labourers, newLabour]);
    },
    [labourers, saveLabourers]
  );

  const updateLabour = useCallback(
    (id: string, data: Partial<Labour>) => {
      saveLabourers(labourers.map((l) => (l.id === id ? { ...l, ...data } : l)));
    },
    [labourers, saveLabourers]
  );

  const deleteLabour = useCallback(
    (id: string) => {
      saveLabourers(labourers.filter((l) => l.id !== id));
    },
    [labourers, saveLabourers]
  );

  const getLabour = useCallback(
    (id: string) => labourers.find((l) => l.id === id),
    [labourers]
  );

  const getLaboursForSite = useCallback(
    (siteId: string) => labourers.filter((l) => l.siteId === siteId),
    [labourers]
  );

  // ── Hajri ─────────────────────────────────────────────────────────────────────

  const setHajri = useCallback(
    (labourId: string, total: number, note?: string) => {
      saveLabourers(
        labourers.map((l) =>
          l.id === labourId
            ? { ...l, totalHajri: Math.max(0, total), hajriNote: note ?? l.hajriNote }
            : l
        )
      );
    },
    [labourers, saveLabourers]
  );

  // ── Advances ──────────────────────────────────────────────────────────────────

  const addAdvance = useCallback(
    (labourId: string, amount: number, note?: string) => {
      saveLabourers(
        labourers.map((l) => {
          if (l.id !== labourId) return l;
          const record: AdvanceRecord = {
            id: generateId(),
            date: new Date().toISOString(),
            amount,
            note,
          };
          return { ...l, advances: [...l.advances, record] };
        })
      );
    },
    [labourers, saveLabourers]
  );

  const deleteAdvance = useCallback(
    (labourId: string, advanceId: string) => {
      saveLabourers(
        labourers.map((l) =>
          l.id === labourId
            ? { ...l, advances: l.advances.filter((a) => a.id !== advanceId) }
            : l
        )
      );
    },
    [labourers, saveLabourers]
  );

  // ── Smart Settlement & Auto-Reset ─────────────────────────────────────────────

  const settleAndReset = useCallback(
    (labourId: string, note?: string): "case1" | "case2" => {
      const labour = labourers.find((l) => l.id === labourId);
      if (!labour) return "case1";

      const totalEarned = labour.totalHajri * labour.ratePerDay;
      const totalAdvance = labour.advances.reduce((s, a) => s + a.amount, 0);
      const date = new Date().toISOString();

      let updatedAdvances: AdvanceRecord[];
      let newPayment: PaymentRecord;
      let settlementCase: "case1" | "case2";

      if (totalEarned >= totalAdvance) {
        // Case 1: Clearance — pay balance to worker, reset everything
        settlementCase = "case1";
        const balance = totalEarned - totalAdvance;
        newPayment = {
          id: generateId(),
          date,
          amount: balance,
          note: note || "Settlement — Full Clearance",
          type: "settlement",
        };
        updatedAdvances = [];
      } else {
        // Case 2: Carry Forward — advance exceeds earned, roll over
        settlementCase = "case2";
        const carry = totalAdvance - totalEarned;
        newPayment = {
          id: generateId(),
          date,
          amount: 0,
          note: note || `Settlement — Carry Forward ₹${carry}`,
          type: "settlement",
        };
        updatedAdvances = [
          {
            id: generateId(),
            date,
            amount: carry,
            note: "Carry Forward from previous settlement",
          },
        ];
      }

      saveLabourers(
        labourers.map((l) =>
          l.id === labourId
            ? {
                ...l,
                totalHajri: 0,
                hajriNote: undefined,
                advances: updatedAdvances,
                payments: [...l.payments, newPayment],
              }
            : l
        )
      );

      return settlementCase;
    },
    [labourers, saveLabourers]
  );

  // ── Calculations ──────────────────────────────────────────────────────────────

  const calcStats = useCallback((labour: Labour): LabourStats => {
    const daysWorked = labour.totalHajri ?? 0;
    const totalEarned = daysWorked * labour.ratePerDay;
    const totalAdvance = labour.advances.reduce((s, a) => s + a.amount, 0);
    const totalPaid = labour.payments.reduce((s, p) => s + p.amount, 0);
    const remainingBalance = totalEarned - totalAdvance - totalPaid;
    const isAdvancePending = totalAdvance > totalEarned - totalPaid;
    const isLeftWithAdvance = labour.status === "left" && totalAdvance > totalPaid;
    return { daysWorked, totalEarned, totalAdvance, totalPaid, remainingBalance, isAdvancePending, isLeftWithAdvance };
  }, []);

  const calcSiteStats = useCallback(
    (siteId: string) => {
      const siteLabours = labourers.filter((l) => l.siteId === siteId);
      const site = sites.find((s) => s.id === siteId);
      let labourCost = 0;
      let totalAdvance = 0;
      let alertCount = 0;
      let activeCount = 0;

      for (const l of siteLabours) {
        const s = calcStats(l);
        labourCost += s.totalEarned;
        totalAdvance += s.totalAdvance;
        if (s.isAdvancePending || s.isLeftWithAdvance) alertCount++;
        if (l.status === "active") activeCount++;
      }

      const otherExpenses = (site?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
      const netCost = labourCost + otherExpenses;

      return { labourCost, totalAdvance, otherExpenses, netCost, activeCount, alertCount };
    },
    [labourers, sites, calcStats]
  );

  // ── Memoized Value ────────────────────────────────────────────────────────────

  const value = useMemo<AppContextValue>(
    () => ({
      user, labourers, sites, isLoading,
      login, logout,
      addSite, updateSite, deleteSite, getSite, addSiteExpense, deleteSiteExpense,
      addLabour, updateLabour, deleteLabour, getLabour, getLaboursForSite,
      setHajri,
      addAdvance, deleteAdvance,
      settleAndReset,
      calcStats, calcSiteStats,
    }),
    [
      user, labourers, sites, isLoading,
      login, logout,
      addSite, updateSite, deleteSite, getSite, addSiteExpense, deleteSiteExpense,
      addLabour, updateLabour, deleteLabour, getLabour, getLaboursForSite,
      setHajri,
      addAdvance, deleteAdvance,
      settleAndReset,
      calcStats, calcSiteStats,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { SITE_COLORS };
