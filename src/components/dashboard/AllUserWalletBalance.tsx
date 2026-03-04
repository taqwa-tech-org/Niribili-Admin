import React, { useEffect, useState, useMemo, useCallback } from "react";
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

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 50;

const AllUserWalletBalance: React.FC = () => {
  const axiosSecure = useAxiosSecure();

  const [wallets, setWallets] = useState<WalletUser[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);

  // ✅ Search only on current page (no API call)
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState<WalletUser | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [operation, setOperation] = useState<"increase" | "decrease">("increase");
  const [loading, setLoading] = useState(false);

  /* =========================
     Server-side fetch
     ========================= */
  const fetchWallets = useCallback(async (currentPage: number) => {
    try {
      setFetching(true);
      setSearch(""); // ✅ clear search on page change

      const res = await axiosSecure.get(
        `/wallet/allUser/balance?page=${currentPage}&limit=${PAGE_SIZE}`
      );

      setWallets(res.data?.data?.wallets || []);
      setMeta(
        res.data?.data?.meta || {
          total: 0,
          page: currentPage,
          limit: PAGE_SIZE,
          totalPages: 1,
        }
      );
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to load wallet data",
        "error"
      );
      setWallets([]);
    } finally {
      setFetching(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchWallets(page);
  }, [page]);

  /* =========================
     Client-side search — current page only
     ========================= */
  const filteredWallets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return wallets;
    return wallets.filter(
      (w) =>
        w.userId?.name?.toLowerCase().includes(q) ||
        w.userId?.email?.toLowerCase().includes(q)
    );
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
        { amount, operation, reason }
      );

      Swal.fire("Success", "Balance updated successfully", "success");

      setSelectedUser(null);
      setAmount(0);
      setReason("");
      setOperation("increase");

      fetchWallets(page);
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

  /* =========================
     Pagination range
     ========================= */
  const getPaginationRange = () => {
    const { totalPages } = meta;
    const range: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else if (page <= 3) {
      range.push(1, 2, 3, 4, "...", totalPages);
    } else if (page >= totalPages - 2) {
      range.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      range.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return range;
  };

  const startIndex = (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, meta.total);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">
          User Wallet Balance Management
        </h2>

        {/* ================= SEARCH ================= */}
        <div className="mb-4 flex items-center gap-3">
          <Input
            placeholder="Search by name or email on this page..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {filteredWallets.length} result{filteredWallets.length !== 1 ? "s" : ""}
            </span>
          )}
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
              {fetching && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}

              {!fetching && filteredWallets.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    {search ? "No results found on this page" : "No user found"}
                  </td>
                </tr>
              )}

              {!fetching &&
                filteredWallets.map((wallet) => (
                  <tr
                    key={wallet._id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">{wallet.userId?.name}</td>
                    <td className="p-3">{wallet.userId?.email}</td>
                    <td className="p-3 text-center font-semibold">
                      ৳ {wallet.balance.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <Button size="sm" onClick={() => setSelectedUser(wallet)}>
                        Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        {meta.totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Info */}
            <p className="text-sm text-gray-500">
              Showing {startIndex}–{endIndex} of {meta.total} users
            </p>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || fetching}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>

              {getPaginationRange().map((p, i) => (
                <button
                  key={i}
                  disabled={p === "..." || fetching}
                  onClick={() => typeof p === "number" && setPage(p)}
                  className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold transition-all ${
                    p === page
                      ? "bg-primary text-white shadow"
                      : p === "..."
                      ? "text-gray-400 cursor-default"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {p}
                </button>
              ))}

              <Button
                variant="outline"
                size="sm"
                disabled={page === meta.totalPages || fetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
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