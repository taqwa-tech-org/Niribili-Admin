import React, { useEffect, useState } from "react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WalletUser {
  _id: string;
  userId: {
    _id: string; // ✅ keep this in state
    name: string;
    email: string;
    phone: string;
  };
  balance: number;
  totalDeposited: number;
  totalSpent: number;
  isActive: boolean;
}

const AllUserWalletBalance: React.FC = () => {
  const axiosSecure = useAxiosSecure();

  const [wallets, setWallets] = useState<WalletUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [operation, setOperation] = useState<"increase" | "decrease">(
    "increase"
  );
  const [loading, setLoading] = useState(false);

  /* =========================
     Fetch all user balances
     ========================= */
  const fetchWallets = async () => {
    try {
      const res = await axiosSecure.get("/wallet/allUser/balance");

      /**
       * ✅ IMPORTANT FIX
       * Backend returns wrapped response
       */
      const walletArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setWallets(walletArray);
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to load wallet data",
        "error"
      );
      setWallets([]); // safety
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  /* =========================
     Adjust balance
     ========================= */
  const handleAdjustBalance = async () => {
    if (!selectedUserId || amount <= 0 || !reason) {
      Swal.fire("Warning", "All fields are required", "warning");
      return;
    }

    try {
      setLoading(true);

      await axiosSecure.patch(
        `/wallet/admin/adjust/${selectedUserId}`,
        {
          amount,
          operation,
          reason,
        }
      );

      Swal.fire("Success", "Balance updated successfully", "success");

      // reset
      setSelectedUserId("");
      setAmount(0);
      setReason("");
      setOperation("increase");

      fetchWallets();
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Balance update failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div
        className="rounded-xl p-4 md:p-6"
        style={{
          background:
            "linear-gradient(135deg, hsl(168 80% 32%) 0%, hsl(168 60% 45%) 100%)",
        }}
      >
        <h2 className="text-white text-xl md:text-2xl font-bold mb-6 text-center">
          User Wallet Balance Management
        </h2>

        {/* ================= TABLE ================= */}
        <div className="bg-white rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-center">Balance</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {wallets.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No wallet data found
                  </td>
                </tr>
              )}

              {wallets.map((wallet) => (
                <tr key={wallet._id} className="border-b">
                  <td className="p-3">{wallet.userId?.name}</td>
                  <td className="p-3">{wallet.userId?.email}</td>
                  <td className="p-3 text-center font-semibold">
                    ৳ {wallet.balance}
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      size="sm"
                      onClick={() =>
                        setSelectedUserId(wallet.userId._id)
                      }
                    >
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= ADJUST FORM ================= */}
        {selectedUserId && (
          <div className="mt-6 bg-white p-4 md:p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              Adjust User Balance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />

              <Input
                placeholder="Reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant={operation === "increase" ? "default" : "outline"}
                  onClick={() => setOperation("increase")}
                >
                  Increase
                </Button>

                <Button
                  className="flex-1"
                  variant={operation === "decrease" ? "destructive" : "outline"}
                  onClick={() => setOperation("decrease")}
                >
                  Decrease
                </Button>
              </div>
            </div>

            <div className="mt-4 text-right">
              <Button onClick={handleAdjustBalance} disabled={loading}>
                {loading ? "Processing..." : "Submit"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllUserWalletBalance;
