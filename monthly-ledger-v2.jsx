import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, Car, ShieldCheck, HeartPulse, Smartphone, Fuel, Zap, Droplets,
  Trash2, Wifi, Tv, ShoppingCart, Package, Sparkles, Scissors,
  MoreHorizontal, Plus, Check, RotateCcw, ChevronDown, ChevronUp, X,
  Loader2, Wallet, DollarSign, PiggyBank, TrendingUp, TrendingDown
} from "lucide-react";

const DEFAULT_BILLS = [
  { key: "rent", name: "Rent", icon: "Home", amount: 0, dueDay: 1, paid: false },
  { key: "car_payment", name: "Car Payment", icon: "Car", amount: 0, dueDay: 5, paid: false },
  { key: "car_insurance", name: "Car Insurance", icon: "ShieldCheck", amount: 0, dueDay: 5, paid: false },
  { key: "health_insurance", name: "Health Insurance", icon: "HeartPulse", amount: 0, dueDay: 1, paid: false },
  { key: "cell_phone", name: "Cell Phones", icon: "Smartphone", amount: 0, dueDay: 10, paid: false },
  { key: "gas", name: "Gas", icon: "Fuel", amount: 0, dueDay: 15, paid: false },
  { key: "electric", name: "Electric", icon: "Zap", amount: 0, dueDay: 12, paid: false },
  { key: "water", name: "Water", icon: "Droplets", amount: 0, dueDay: 12, paid: false },
  { key: "trash", name: "Trash", icon: "Trash2", amount: 0, dueDay: 12, paid: false },
  { key: "internet", name: "Internet", icon: "Wifi", amount: 0, dueDay: 18, paid: false },
  { key: "streaming", name: "Streaming", icon: "Tv", amount: 0, dueDay: 20, paid: false },
  { key: "food", name: "Food", icon: "ShoppingCart", amount: 0, dueDay: 0, paid: false },
  { key: "household", name: "Household Items", icon: "Package", amount: 0, dueDay: 0, paid: false },
  { key: "nails", name: "Nails", icon: "Sparkles", amount: 0, dueDay: 0, paid: false },
  { key: "haircuts", name: "Haircuts", icon: "Scissors", amount: 0, dueDay: 0, paid: false },
  { key: "misc", name: "Miscellaneous", icon: "MoreHorizontal", amount: 0, dueDay: 0, paid: false },
];

const DEFAULT_INCOME = [
  { key: "paycheck", name: "Paycheck / Commission", icon: "DollarSign", amount: 0, received: false },
];

const ICONS = {
  Home, Car, ShieldCheck, HeartPulse, Smartphone, Fuel, Zap, Droplets,
  Trash2, Wifi, Tv, ShoppingCart, Package, Sparkles, Scissors, MoreHorizontal,
  DollarSign, PiggyBank,
};

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function monthLabel(d) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function fmt(n) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const STORAGE_KEY = "ledger-state-v2"; // separate key from v1 ("ledger-items") so nothing existing is overwritten
const HISTORY_KEY = "ledger-history-v2";

export default function Ledger() {
  const [bills, setBills] = useState(null);
  const [income, setIncome] = useState(null);
  const [monthDate, setMonthDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("loading");
  const [showHistory, setShowHistory] = useState(false);
  const [addingBill, setAddingBill] = useState(false);
  const [addingIncome, setAddingIncome] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        let state = null;
        try {
          const res = await window.storage.get(STORAGE_KEY, false);
          if (res && res.value) state = JSON.parse(res.value);
        } catch (e) {
          state = null;
        }
        if (state && state.bills && state.income) {
          setBills(state.bills);
          setIncome(state.income);
          if (state.monthKey) {
            const [y, m] = state.monthKey.split("-").map(Number);
            setMonthDate(new Date(y, m - 1, 1));
          }
        } else {
          setBills(DEFAULT_BILLS.map((it) => ({ ...it, id: uid() })));
          setIncome(DEFAULT_INCOME.map((it) => ({ ...it, id: uid() })));
        }

        let hist = [];
        try {
          const hres = await window.storage.get(HISTORY_KEY, false);
          if (hres && hres.value) hist = JSON.parse(hres.value);
        } catch (e) {
          hist = [];
        }
        setHistory(hist);
        setStatus("ready");
      } catch (e) {
        setStatus("error");
      }
    })();
  }, []);

  const persist = useCallback((nextBills, nextIncome, nextMonthDate) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(
          STORAGE_KEY,
          JSON.stringify({ bills: nextBills, income: nextIncome, monthKey: monthKey(nextMonthDate) }),
          false
        );
      } catch (e) {
        // will retry on next change
      }
    }, 300);
  }, []);

  const updateBill = (id, patch) => {
    setBills((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      persist(next, income, monthDate);
      return next;
    });
  };
  const removeBill = (id) => {
    setBills((prev) => {
      const next = prev.filter((it) => it.id !== id);
      persist(next, income, monthDate);
      return next;
    });
  };
  const updateIncome = (id, patch) => {
    setIncome((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      persist(bills, next, monthDate);
      return next;
    });
  };
  const removeIncome = (id) => {
    setIncome((prev) => {
      const next = prev.filter((it) => it.id !== id);
      persist(bills, next, monthDate);
      return next;
    });
  };

  const addBill = () => {
    const name = newName.trim();
    if (!name) return;
    const amt = parseFloat(newAmount) || 0;
    setBills((prev) => {
      const next = [...prev, { id: uid(), key: "custom_" + uid(), name, icon: "MoreHorizontal", amount: amt, dueDay: 0, paid: false }];
      persist(next, income, monthDate);
      return next;
    });
    setNewName(""); setNewAmount(""); setAddingBill(false);
  };
  const addIncomeItem = () => {
    const name = newName.trim();
    if (!name) return;
    const amt = parseFloat(newAmount) || 0;
    setIncome((prev) => {
      const next = [...prev, { id: uid(), key: "custom_" + uid(), name, icon: "TrendingUp", amount: amt, received: false }];
      persist(bills, next, monthDate);
      return next;
    });
    setNewName(""); setNewAmount(""); setAddingIncome(false);
  };

  const closeMonth = async () => {
    const totalExpenses = bills.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const totalIncome = income.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const balance = totalIncome - totalExpenses;

    const entry = {
      key: monthKey(monthDate),
      label: monthLabel(monthDate),
      income: totalIncome,
      expenses: totalExpenses,
      balance,
      closedAt: new Date().toISOString(),
    };
    const nextHistory = [entry, ...history].slice(0, 24);
    setHistory(nextHistory);
    try {
      await window.storage.set(HISTORY_KEY, JSON.stringify(nextHistory), false);
    } catch (e) {}

    const nextMonthDate = addMonths(monthDate, 1);
    const resetBills = bills.map((it) => ({ ...it, paid: false }));
    // drop last month's rollover income line so it doesn't stack, keep everything else
    const carryIncome = income
      .filter((it) => it.key !== "rollover")
      .map((it) => ({ ...it, received: false }));
    if (balance !== 0) {
      carryIncome.unshift({
        id: uid(),
        key: "rollover",
        name: `Savings carried from ${monthLabel(monthDate)}`,
        icon: "PiggyBank",
        amount: balance,
        received: true,
      });
    }

    setBills(resetBills);
    setIncome(carryIncome);
    setMonthDate(nextMonthDate);
    persist(resetBills, carryIncome, nextMonthDate);
  };

  if (status === "loading") {
    return (
      <div style={styles.loadingWrap}>
        <Loader2 className="animate-spin" size={28} color="#7FA8C9" />
        <div style={{ marginTop: 10, color: "#7FA8C9", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, letterSpacing: 1 }}>
          OPENING LEDGER…
        </div>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div style={styles.loadingWrap}>
        <div style={{ color: "#E2555A", fontFamily: "'IBM Plex Mono', monospace" }}>
          Could not open the ledger. Try reloading.
        </div>
      </div>
    );
  }

  const totalExpenses = bills.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const paidTotal = bills.filter((it) => it.paid).reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const totalIncome = income.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const receivedTotal = income.filter((it) => it.received).reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const projectedBalance = totalIncome - totalExpenses;
  const currentBalance = receivedTotal - paidTotal;
  const pct = totalExpenses > 0 ? Math.round((paidTotal / totalExpenses) * 100) : 0;

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .ledger-row { transition: background 0.15s ease, transform 0.1s ease; }
        .ledger-row:active { transform: scale(0.997); }
        .stamp-btn { transition: transform 0.12s ease, background 0.12s ease; }
        .stamp-btn:active { transform: scale(0.9); }
        .name-input:focus, .amount-input:focus { border-bottom-color: #5DA9E9 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
      `}</style>

      <div style={styles.grid} />

      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.eyebrow}>MONTHLY LEDGER</div>
          <div style={styles.monthTitle}>{monthLabel(monthDate)}</div>
        </div>

        {/* Summary card */}
        <div style={styles.summaryCard}>
          <div style={styles.summaryRow}>
            <div>
              <div style={styles.summaryLabel}>INCOME</div>
              <div style={{ ...styles.summaryValueMed, color: "#4FAE7A" }}>{fmt(totalIncome)}</div>
            </div>
            <div>
              <div style={styles.summaryLabel}>EXPENSES</div>
              <div style={{ ...styles.summaryValueMed, color: "#E8A33D" }}>{fmt(totalExpenses)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={styles.summaryLabel}>END-OF-MONTH BALANCE</div>
              <div style={{ ...styles.summaryValueBig, color: projectedBalance >= 0 ? "#4FAE7A" : "#E2555A" }}>
                {fmt(projectedBalance)}
              </div>
            </div>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${pct}%` }} />
          </div>
          <div style={styles.progressCaption}>
            {fmt(currentBalance)} cash on hand right now · {fmt(receivedTotal)} received · {fmt(paidTotal)} paid
          </div>
        </div>

        {/* INCOME SECTION */}
        <div style={styles.sectionHeader}>
          <TrendingUp size={14} color="#4FAE7A" />
          <span>MONEY IN</span>
        </div>
        <div style={styles.listWrap}>
          {income.map((it) => {
            const Icon = ICONS[it.icon] || DollarSign;
            return (
              <div key={it.id} className="ledger-row" style={styles.row}>
                <div style={{ ...styles.iconWrap, background: it.received ? "rgba(79,174,122,0.15)" : "rgba(79,174,122,0.08)" }}>
                  <Icon size={17} color="#4FAE7A" />
                </div>
                <input
                  className="name-input"
                  value={it.name}
                  onChange={(e) => updateIncome(it.id, { name: e.target.value })}
                  style={styles.nameInput}
                />
                <div style={styles.amountWrap}>
                  <span style={styles.currencyPrefix}>$</span>
                  <input
                    className="amount-input"
                    type="number"
                    inputMode="decimal"
                    value={it.amount === 0 ? "" : it.amount}
                    placeholder="0"
                    onChange={(e) => updateIncome(it.id, { amount: parseFloat(e.target.value) || 0 })}
                    style={styles.amountInput}
                  />
                </div>
                <button
                  className="stamp-btn"
                  onClick={() => updateIncome(it.id, { received: !it.received })}
                  style={{ ...styles.stampBtn, background: it.received ? "#4FAE7A" : "transparent", borderColor: it.received ? "#4FAE7A" : "rgba(255,255,255,0.25)" }}
                  aria-label={it.received ? "Mark not received" : "Mark received"}
                >
                  {it.received && <Check size={14} color="#0B2340" strokeWidth={3} />}
                </button>
                <button onClick={() => removeIncome(it.id)} style={styles.removeBtn} aria-label="Remove item">
                  <X size={13} color="#7FA8C9" />
                </button>
              </div>
            );
          })}
        </div>
        {addingIncome ? (
          <div style={styles.addCard}>
            <input autoFocus placeholder="Income source" value={newName} onChange={(e) => setNewName(e.target.value)} style={styles.addInputName} />
            <div style={styles.amountWrap}>
              <span style={styles.currencyPrefix}>$</span>
              <input type="number" inputMode="decimal" placeholder="0" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} style={styles.amountInput} />
            </div>
            <button onClick={addIncomeItem} style={styles.addConfirmBtn}>Add</button>
            <button onClick={() => { setAddingIncome(false); setNewName(""); setNewAmount(""); }} style={styles.addCancelBtn}><X size={14} color="#7FA8C9" /></button>
          </div>
        ) : (
          <button onClick={() => setAddingIncome(true)} style={{ ...styles.addRowBtn, borderColor: "rgba(79,174,122,0.3)", color: "#4FAE7A" }}>
            <Plus size={15} color="#4FAE7A" />
            <span>Add income source</span>
          </button>
        )}

        {/* BILLS SECTION */}
        <div style={styles.sectionHeader}>
          <TrendingDown size={14} color="#E8A33D" />
          <span>MONEY OUT</span>
        </div>
        <div style={styles.listWrap}>
          {bills.map((it) => {
            const Icon = ICONS[it.icon] || MoreHorizontal;
            return (
              <div key={it.id} className="ledger-row" style={styles.row}>
                <div style={{ ...styles.iconWrap, background: it.paid ? "rgba(79,174,122,0.15)" : "rgba(93,169,233,0.1)" }}>
                  <Icon size={17} color={it.paid ? "#4FAE7A" : "#5DA9E9"} />
                </div>
                <div style={styles.rowMain}>
                  <input
                    className="name-input"
                    value={it.name}
                    onChange={(e) => updateBill(it.id, { name: e.target.value })}
                    style={styles.nameInput}
                  />
                  <div style={styles.dueDayRow}>
                    <span style={styles.rowSub}>Due day</span>
                    <input
                      className="amount-input"
                      type="number"
                      inputMode="numeric"
                      value={it.dueDay === 0 ? "" : it.dueDay}
                      placeholder="—"
                      onChange={(e) => updateBill(it.id, { dueDay: parseInt(e.target.value) || 0 })}
                      style={styles.dueDayInput}
                    />
                  </div>
                </div>
                <div style={styles.amountWrap}>
                  <span style={styles.currencyPrefix}>$</span>
                  <input
                    className="amount-input"
                    type="number"
                    inputMode="decimal"
                    value={it.amount === 0 ? "" : it.amount}
                    placeholder="0"
                    onChange={(e) => updateBill(it.id, { amount: parseFloat(e.target.value) || 0 })}
                    style={styles.amountInput}
                  />
                </div>
                <button
                  className="stamp-btn"
                  onClick={() => updateBill(it.id, { paid: !it.paid })}
                  style={{ ...styles.stampBtn, background: it.paid ? "#4FAE7A" : "transparent", borderColor: it.paid ? "#4FAE7A" : "rgba(255,255,255,0.25)" }}
                  aria-label={it.paid ? "Mark unpaid" : "Mark paid"}
                >
                  {it.paid && <Check size={14} color="#0B2340" strokeWidth={3} />}
                </button>
                <button onClick={() => removeBill(it.id)} style={styles.removeBtn} aria-label="Remove item">
                  <X size={13} color="#7FA8C9" />
                </button>
              </div>
            );
          })}
        </div>
        {addingBill ? (
          <div style={styles.addCard}>
            <input autoFocus placeholder="Bill name" value={newName} onChange={(e) => setNewName(e.target.value)} style={styles.addInputName} />
            <div style={styles.amountWrap}>
              <span style={styles.currencyPrefix}>$</span>
              <input type="number" inputMode="decimal" placeholder="0" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} style={styles.amountInput} />
            </div>
            <button onClick={addBill} style={styles.addConfirmBtn}>Add</button>
            <button onClick={() => { setAddingBill(false); setNewName(""); setNewAmount(""); }} style={styles.addCancelBtn}><X size={14} color="#7FA8C9" /></button>
          </div>
        ) : (
          <button onClick={() => setAddingBill(true)} style={styles.addRowBtn}>
            <Plus size={15} color="#5DA9E9" />
            <span>Add bill</span>
          </button>
        )}

        {/* Close month */}
        <button onClick={closeMonth} style={styles.closeMonthBtn}>
          <RotateCcw size={14} />
          <span>Close {monthLabel(monthDate)} &amp; start new month</span>
        </button>
        <div style={styles.closeMonthHint}>
          Archives this month, resets paid/received stamps, and carries leftover balance into next month as savings income.
        </div>

        {/* History */}
        <button onClick={() => setShowHistory((s) => !s)} style={styles.historyToggle}>
          <Wallet size={14} color="#7FA8C9" />
          <span>History ({history.length})</span>
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showHistory && (
          <div style={styles.historyList}>
            {history.length === 0 && <div style={styles.historyEmpty}>No closed months yet.</div>}
            {history.map((h) => (
              <div key={h.key} style={styles.historyRow}>
                <span style={styles.historyLabel}>{h.label}</span>
                <span style={{ ...styles.historyValue, color: h.balance >= 0 ? "#4FAE7A" : "#E2555A" }}>
                  {fmt(h.balance)} balance
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  app: { position: "relative", minHeight: "100vh", width: "100%", background: "#0B2340", fontFamily: "'Inter', sans-serif", color: "#EAF2FB", overflowX: "hidden" },
  grid: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(93,169,233,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(93,169,233,0.07) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" },
  loadingWrap: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0B2340" },
  content: { position: "relative", maxWidth: 560, margin: "0 auto", padding: "28px 16px 48px" },
  header: { marginBottom: 18 },
  eyebrow: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: 3, color: "#5DA9E9", marginBottom: 4 },
  monthTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: -0.5 },
  summaryCard: { background: "#123157", border: "1px solid rgba(93,169,233,0.25)", borderRadius: 14, padding: "18px 18px 16px", marginBottom: 22, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" },
  summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 8 },
  summaryLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1.5, color: "#7FA8C9", marginBottom: 4 },
  summaryValueMed: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 },
  summaryValueBig: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 },
  progressTrack: { height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #5DA9E9, #4FAE7A)", borderRadius: 4, transition: "width 0.3s ease" },
  progressCaption: { marginTop: 8, fontSize: 11.5, color: "#7FA8C9", fontFamily: "'IBM Plex Mono', monospace" },
  sectionHeader: { display: "flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: 2, color: "#7FA8C9", margin: "18px 2px 8px" },
  listWrap: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 },
  row: { display: "flex", alignItems: "center", gap: 8, background: "#0E2C4E", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 10px" },
  iconWrap: { width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rowMain: { flex: 1, minWidth: 0 },
  nameInput: { flex: 1, minWidth: 0, background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.12)", color: "#EAF2FB", fontFamily: "'Inter', sans-serif", fontSize: 14.5, fontWeight: 500, padding: "2px 2px", outline: "none" },
  rowSub: { fontSize: 10.5, color: "#5A7DA0", fontFamily: "'IBM Plex Mono', monospace" },
  dueDayRow: { display: "flex", alignItems: "center", gap: 4, marginTop: 3 },
  dueDayInput: { width: 26, background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#7FA8C9", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, padding: 0, outline: "none" },
  amountWrap: { display: "flex", alignItems: "center", gap: 2, flexShrink: 0 },
  currencyPrefix: { color: "#5A7DA0", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" },
  amountInput: { width: 58, background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#EAF2FB", fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, padding: "2px 2px", textAlign: "right", outline: "none" },
  stampBtn: { width: 26, height: 26, borderRadius: "50%", border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  removeBtn: { background: "transparent", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 },
  addCard: { display: "flex", alignItems: "center", gap: 8, background: "#0E2C4E", border: "1px dashed rgba(93,169,233,0.4)", borderRadius: 10, padding: "10px 10px", marginBottom: 12 },
  addInputName: { flex: 1, background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", color: "#EAF2FB", fontSize: 14, padding: "2px 2px", outline: "none", fontFamily: "'Inter', sans-serif" },
  addConfirmBtn: { background: "#5DA9E9", color: "#0B2340", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" },
  addCancelBtn: { background: "transparent", border: "none", cursor: "pointer" },
  addRowBtn: { display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "1px dashed rgba(93,169,233,0.3)", borderRadius: 10, padding: "10px 12px", color: "#5DA9E9", fontSize: 13.5, cursor: "pointer", marginBottom: 8, width: "100%", fontFamily: "'Inter', sans-serif" },
  closeMonthBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "#1B4B72", border: "1px solid rgba(93,169,233,0.3)", borderRadius: 10, padding: "12px", color: "#EAF2FB", fontSize: 13.5, fontWeight: 500, cursor: "pointer", marginTop: 14 },
  closeMonthHint: { textAlign: "center", fontSize: 11, color: "#5A7DA0", marginTop: 8, marginBottom: 24, fontFamily: "'IBM Plex Mono', monospace" },
  historyToggle: { display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: "#7FA8C9", fontSize: 13, cursor: "pointer", padding: "6px 0", fontFamily: "'Inter', sans-serif" },
  historyList: { marginTop: 10, display: "flex", flexDirection: "column", gap: 6 },
  historyEmpty: { fontSize: 12.5, color: "#5A7DA0", fontFamily: "'IBM Plex Mono', monospace" },
  historyRow: { display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "6px 0", fontFamily: "'IBM Plex Mono', monospace" },
  historyLabel: { color: "#EAF2FB" },
  historyValue: { color: "#7FA8C9" },
};
