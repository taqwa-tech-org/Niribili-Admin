import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const AuthComponent: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  // 🔐 Login & Register Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // ✅ LOGIN
        const res = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/auth/login`,
          {
            email,
            password,
          },
        );

        const { accessToken, refreshToken } = res.data.data;

        // ✅ Use AuthContext login (stores in cookies + fetches user)
        await login(accessToken, refreshToken);

        // ✅ CONTEXT LOGIN
        toast.success("লগইন সফল হয়েছে 🎉");
        navigate("/admin-dashboard");
      } else {
        // ✅ REGISTER
        await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/register`, {
          name,
          phone,
          email,
          password,
        });

        toast.success("রেজিস্ট্রেশন সফল হয়েছে 🎉");
        setIsLogin(true); // Switch to login tab
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "কিছু একটা সমস্যা হয়েছে";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg border overflow-hidden">
        {/* Tabs */}
        <div className="flex p-2 bg-muted/50 gap-2">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg font-medium ${
              isLogin
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            লগইন
          </button>

          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg font-medium ${
              !isLogin
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            রেজিস্ট্রেশন
          </button>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">
              {isLogin ? "স্বাগতম" : "অ্যাকাউন্ট তৈরি করুন"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin
                ? "আপনার অ্যাকাউন্টে প্রবেশ করুন"
                : "নতুন অ্যাকাউন্ট খুলুন"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Name & Phone (Register Only) */}
                {!isLogin && (
                  <>
                    <div>
                      <label className="text-sm">নাম</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm">ফোন নাম্বার</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-sm">ইমেইল</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm">পাসওয়ার্ড</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-white rounded-lg"
                >
                  {loading
                    ? "অপেক্ষা করুন..."
                    : isLogin
                      ? "লগইন করুন"
                      : "রেজিস্ট্রেশন করুন"}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;
