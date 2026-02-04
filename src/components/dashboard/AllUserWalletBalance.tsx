import React, { useEffect, useMemo, useState } from "react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WalletUser {
  _id: string;
  userId: {
    _id: string;
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
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<WalletUser | null>(null);
  const [amount, setAmount] = useState<number>();
  const [reason, setReason] = useState("");
  const [operation, setOperation] = useState<"increase" | "decrease">(
    "increase"
  );
  const [loading, setLoading] = useState(false);

  /* =========================
     Fetch wallets
     ========================= */
  const fetchWallets = async () => {
    try {
      const res = await axiosSecure.get("/wallet/allUser/balance");

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
      setWallets([]);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  /* =========================
     Search filter
     ========================= */
  const filteredWallets = useMemo(() => {
    return wallets.filter((w) => {
      const q = search.toLowerCase();
      return (
        w.userId?.name?.toLowerCase().includes(q) ||
        w.userId?.email?.toLowerCase().includes(q)
      );
    });
  }, [wallets, search]);

  /* =========================
     Adjust balance
     ========================= */
  const handleAdjustBalance = async () => {
    if (!selectedUser || amount <= 0 || !reason) {
      Swal.fire("Warning", "All fields are required", "warning");
      return;
    }

    try {
      setLoading(true);

      await axiosSecure.patch(
        `/wallet/admin/adjust/${selectedUser.userId._id}`,
        {
          amount,
          operation,
          reason,
        }
      );

      Swal.fire("Success", "Balance updated successfully", "success");

      setSelectedUser(null);
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
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">
          User Wallet Balance Management
        </h2>

        {/* ================= SEARCH ================= */}
        <div className="mb-4">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto border rounded-lg">
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
              {filteredWallets.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No user found
                  </td>
                </tr>
              )}

              {filteredWallets.map((wallet) => (
                <tr key={wallet._id} className="border-b">
                  <td className="p-3">{wallet.userId?.name}</td>
                  <td className="p-3">{wallet.userId?.email}</td>
                  <td className="p-3 text-center font-semibold">
                    ৳ {wallet.balance}
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      size="sm"
                      onClick={() => setSelectedUser(wallet)}
                    >
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Adjust Balance for {selectedUser.userId.name}
            </h3>

            <div className="space-y-3">
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

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
              >
                Cancel
              </Button>

              <Button onClick={handleAdjustBalance} disabled={loading}>
                {loading ? "Processing..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUserWalletBalance;
