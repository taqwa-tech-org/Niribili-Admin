import { useState, useEffect, useCallback } from "react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";

interface User {
  _id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

interface Wallet {
  _id: string;
  balance: number;
}

interface GatewayResponse {
  status: string;
  tran_date: string;
  tran_id: string;
  amount: string;
  card_type: string;
  card_issuer: string;
  [key: string]: any;
}

interface Transaction {
  _id: string;
  userId: User;
  walletId: Wallet;
  type: "deposit" | "deduct";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId: string | null;
  referenceType: string;
  month: string;
  status: string;
  transactionId: string | null;
  gatewayResponse: GatewayResponse | null;
  createdAt: string;
  updatedAt: string;
}

type FilterType = "all" | "deposit" | "deduct";

const ITEMS_PER_PAGE = 10;

const UserTransaction = () => {
  const axiosSecure = useAxiosSecure();

  // ✅ All transactions fetched once
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  /* =========================
     Fetch transactions from backend
     ========================= */
  const fetchTransactions = useCallback(async (page: number, type: FilterType, query: string) => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        status: "completed",
        page,
        limit: ITEMS_PER_PAGE,
      };

      if (type !== "all") {
        params.type = type;
      }

      const trimmedQuery = query.trim();
      if (trimmedQuery) {
        params.search = trimmedQuery;
        params.searchTerm = trimmedQuery;
      }

      const res = await axiosSecure.get("/wallet/admin/all-transactions", { params });

      const meta = res.data?.data?.meta ?? {};
      const data: Transaction[] =
        res.data?.data?.transactions ??
        res.data?.data?.results ??
        res.data?.transactions ??
        res.data?.results ??
        [];
      setAllTransactions(data);
      setTotalPages(meta.totalPages ?? 1);
      setTotalTransactions(meta.total ?? data.length);
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions");
      setAllTransactions([]);
      setTotalPages(1);
      setTotalTransactions(0);
    } finally {
      setLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    fetchTransactions(currentPage, filterType, searchQuery);
  }, [currentPage, filterType, searchQuery, fetchTransactions]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const startIndex = totalTransactions === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalTransactions);

  /* =========================
     Helpers
     ========================= */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString()}`;

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPaginationRange = () => {
    const range: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) range.push(i);
        range.push("...");
        range.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        range.push(1);
        range.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) range.push(i);
      } else {
        range.push(1);
        range.push("...");
        range.push(currentPage - 1);
        range.push(currentPage);
        range.push(currentPage + 1);
        range.push("...");
        range.push(totalPages);
      }
    }

    return range;
  };

  /* =========================
     Render
     ========================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(168,80%,32%)] to-[hsl(168,60%,45%)]">
        <div className="text-white text-xl">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(168,80%,32%)] to-[hsl(168,60%,45%)]">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <p className="text-red-600 text-lg font-semibold">Error: {error}</p>
          <button
            onClick={() => fetchTransactions(currentPage, filterType, searchQuery)}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[hsl(168,80%,32%)] to-[hsl(168,60%,45%)] text-white rounded-lg hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(168,80%,32%)] to-[hsl(168,60%,45%)] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            User Balance Transactions
          </h1>
          <p className="text-gray-600">
            Total Transactions: {totalTransactions}
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full px-5 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:border-[hsl(168,80%,32%)] focus:outline-none transition-colors text-gray-700"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[hsl(168,80%,32%)] to-[hsl(168,60%,45%)] text-white text-sm font-semibold hover:opacity-90 transition"
            >
              Search
            </button>
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Found {totalTransactions} result
              {totalTransactions !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            {(["all", "deposit", "deduct"] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setCurrentPage(1);
                  setFilterType(type);
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  filterType === type
                    ? type === "all"
                      ? "bg-gradient-to-r from-[hsl(168,80%,32%)] to-[hsl(168,60%,45%)] text-white shadow-lg scale-105"
                      : type === "deposit"
                      ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg scale-105"
                      : "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {type === "all"
                  ? "All Transactions"
                  : type === "deposit"
                  ? "Deposits"
                  : "Deductions"}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {allTransactions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-500 text-lg">
                {searchQuery
                  ? "No transactions found matching your search"
                  : "No transactions found"}
              </p>
            </div>
          ) : (
            allTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[hsl(168,80%,32%)] to-[hsl(168,60%,45%)] flex items-center justify-center text-white font-bold text-lg">
                        {transaction.userId?.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {transaction.userId?.name ?? "Deleted user"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {transaction.userId?.email ?? "—"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.userId?.phone ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          transaction.type === "deposit"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {transaction.type.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                        {transaction.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </p>
                    {transaction.transactionId && (
                      <p className="text-xs text-gray-500 font-mono">
                        ID: {transaction.transactionId}
                      </p>
                    )}
                  </div>

                  {/* Amount Info */}
                  <div className="flex-1 text-right lg:text-left">
                    <div className="mb-3">
                      <p
                        className={`text-2xl font-bold ${
                          transaction.type === "deposit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "deposit" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between lg:justify-start lg:gap-4">
                        <span className="text-gray-600">Before:</span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(transaction.balanceBefore)}
                        </span>
                      </div>
                      <div className="flex justify-between lg:justify-start lg:gap-4">
                        <span className="text-gray-600">After:</span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(transaction.balanceAfter)}
                        </span>
                      </div>
                      <div className="flex justify-between lg:justify-start lg:gap-4">
                        <span className="text-gray-600">Current:</span>
                        <span className="font-bold text-[hsl(168,80%,32%)]">
                          {formatCurrency(transaction.walletId?.balance ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gateway Info */}
                  {transaction.gatewayResponse && (
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          Payment Gateway
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.gatewayResponse.card_type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.gatewayResponse.card_issuer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex} to {endIndex} of{" "}
                {totalTransactions} transactions
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-[hsl(168,80%,32%)] to-[hsl(168,60%,45%)] text-white hover:opacity-90"
                  }`}
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {getPaginationRange().map((page, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        typeof page === "number" && goToPage(page)
                      }
                      disabled={page === "..."}
                      className={`min-w-[40px] h-10 rounded-lg font-semibold transition-all ${
                        page === currentPage
                          ? "bg-gradient-to-r from-[hsl(168,80%,32%)] to-[hsl(168,60%,45%)] text-white shadow-lg"
                          : page === "..."
                          ? "bg-transparent text-gray-400 cursor-default"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-[hsl(168,80%,32%)] to-[hsl(168,60%,45%)] text-white hover:opacity-90"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTransaction;