import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AttendanceRecord {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  present: boolean;
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
}

export interface NoteRecord {
  id: string;
  date: string;
  text: string;
}

export type LabourStatus = "active" | "left";

export interface Labour {
  id: string;
  name: string;
  phone?: string;
  workType?: string;
  ratePerDay: number;
  status: LabourStatus;
  createdAt: string;
  notes?: string;
  attendance: AttendanceRecord[];
  advances: AdvanceRecord[];
  payments: PaymentRecord[];
  noteHistory: NoteRecord[];
}

export interface AuthUser {
  phone: string;
  loggedInAt: string;
}

interface AppContextValue {
  user: AuthUser | null;
  labourers: Labour[];
  isLoading: boolean;

  // Auth
  login: (phone: string) => void;
  logout: () => void;

  // Labour CRUD
  addLabour: (data: Omit<Labour, "id" | "createdAt" | "attendance" | "advances" | "payments" | "noteHistory">) => void;
  updateLabour: (id: string, data: Partial<Labour>) => void;
  deleteLabour: (id: string) => void;
  getLabour: (id: string) => Labour | undefined;

  // Attendance
  markAttendance: (labourId: string, date: string, present: boolean) => void;

  // Advances
  addAdvance: (labourId: string, amount: number, note?: string) => void;

  // Payments
  settlePayment: (labourId: string, amount: number, note?: string) => void;

  // Notes
  addNote: (labourId: string, text: string) => void;

  // Calculations
  calcStats: (labour: Labour) => {
    daysWorked: number;
    totalEarned: number;
    totalAdvance: number;
    totalPaid: number;
    remainingBalance: number;
    isAdvancePending: boolean;
    isLeftWithAdvance: boolean;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  USER: "@labour_app_user",
  LABOURERS: "@labour_app_labourers",
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [labourers, setLabourers] = useState<Labour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [userRaw, laboursRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.LABOURERS),
        ]);
        if (userRaw) setUser(JSON.parse(userRaw));
        if (laboursRaw) setLabourers(JSON.parse(laboursRaw));
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const saveLabourers = useCallback(async (list: Labour[]) => {
    setLabourers(list);
    await AsyncStorage.setItem(STORAGE_KEYS.LABOURERS, JSON.stringify(list));
  }, []);

  const login = useCallback(async (phone: string) => {
    const u: AuthUser = { phone, loggedInAt: new Date().toISOString() };
    setUser(u);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  const addLabour = useCallback(
    (data: Omit<Labour, "id" | "createdAt" | "attendance" | "advances" | "payments" | "noteHistory">) => {
      const newLabour: Labour = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        attendance: [],
        advances: [],
        payments: [],
        noteHistory: [],
      };
      const updated = [...labourers, newLabour];
      saveLabourers(updated);
    },
    [labourers, saveLabourers]
  );

  const updateLabour = useCallback(
    (id: string, data: Partial<Labour>) => {
      const updated = labourers.map((l) => (l.id === id ? { ...l, ...data } : l));
      saveLabourers(updated);
    },
    [labourers, saveLabourers]
  );

  const deleteLabour = useCallback(
    (id: string) => {
      const updated = labourers.filter((l) => l.id !== id);
      saveLabourers(updated);
    },
    [labourers, saveLabourers]
  );

  const getLabour = useCallback(
    (id: string) => labourers.find((l) => l.id === id),
    [labourers]
  );

  const markAttendance = useCallback(
    (labourId: string, date: string, present: boolean) => {
      const updated = labourers.map((l) => {
        if (l.id !== labourId) return l;
        const existing = l.attendance.find((a) => a.date === date);
        let newAttendance: AttendanceRecord[];
        if (existing) {
          newAttendance = l.attendance.map((a) =>
            a.date === date ? { ...a, present } : a
          );
        } else {
          newAttendance = [...l.attendance, { id: generateId(), date, present }];
        }
        return { ...l, attendance: newAttendance };
      });
      saveLabourers(updated);
    },
    [labourers, saveLabourers]
  );

  const addAdvance = useCallback(
    (labourId: string, amount: number, note?: string) => {
      const updated = labourers.map((l) => {
        if (l.id !== labourId) return l;
        const record: AdvanceRecord = {
          id: generateId(),
          date: new Date().toISOString(),
          amount,
          note,
        };
        return { ...l, advances: [...l.advances, record] };
      });
      saveLabourers(updated);
    },
    [labourers, saveLabourers]
  );

  const settlePayment = useCallback(
    (labourId: string, amount: number, note?: string) => {
      const updated = labourers.map((l) => {
        if (l.id !== labourId) return l;
        const record: PaymentRecord = {
          id: generateId(),
          date: new Date().toISOString(),
          amount,
          note,
        };
        return { ...l, payments: [...l.payments, record] };
      });
      saveLabourers(updated);
    },
    [labourers, saveLabourers]
  );

  const addNote = useCallback(
    (labourId: string, text: string) => {
      const updated = labourers.map((l) => {
        if (l.id !== labourId) return l;
        const record: NoteRecord = {
          id: generateId(),
          date: new Date().toISOString(),
          text,
        };
        return { ...l, noteHistory: [...l.noteHistory, record] };
      });
      saveLabourers(updated);
    },
    [labourers, saveLabourers]
  );

  const calcStats = useCallback((labour: Labour) => {
    const daysWorked = labour.attendance.filter((a) => a.present).length;
    const totalEarned = daysWorked * labour.ratePerDay;
    const totalAdvance = labour.advances.reduce((s, a) => s + a.amount, 0);
    const totalPaid = labour.payments.reduce((s, p) => s + p.amount, 0);
    const remainingBalance = totalEarned - totalAdvance - totalPaid;
    const isAdvancePending = totalAdvance > totalEarned - totalPaid;
    const isLeftWithAdvance = labour.status === "left" && totalAdvance > totalPaid;

    return {
      daysWorked,
      totalEarned,
      totalAdvance,
      totalPaid,
      remainingBalance,
      isAdvancePending,
      isLeftWithAdvance,
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      labourers,
      isLoading,
      login,
      logout,
      addLabour,
      updateLabour,
      deleteLabour,
      getLabour,
      markAttendance,
      addAdvance,
      settlePayment,
      addNote,
      calcStats,
    }),
    [
      user,
      labourers,
      isLoading,
      login,
      logout,
      addLabour,
      updateLabour,
      deleteLabour,
      getLabour,
      markAttendance,
      addAdvance,
      settlePayment,
      addNote,
      calcStats,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
