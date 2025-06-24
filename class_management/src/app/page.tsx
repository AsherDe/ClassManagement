"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  
  const loginMutation = api.auth.login.useMutation({
    onSuccess: (user) => {
      localStorage.setItem("user", JSON.stringify(user));
      if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "teacher") {
        router.push("/teacher");
      } else if (user.role === "student") {
        router.push("/student");
      }
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  const handleQuickLogin = (role: "admin" | "teacher" | "student") => {
    const credentials = {
      admin: { username: "admin", password: "admin123" },
      teacher: { username: "t001", password: "teacher123" }, 
      student: { username: "20231001111", password: "student123" }
    };
    
    const { username: user, password: pass } = credentials[role];
    setUsername(user);
    setPassword(pass);
    loginMutation.mutate({ username: user, password: pass });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">班级管理系统</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loginMutation.isPending ? "登录中..." : "登录"}
          </button>
        </form>
        
        <div className="mt-6">
          <div className="flex items-center justify-center mb-4">
            <div className="border-t border-gray-300 flex-grow"></div>
            <span className="px-3 text-sm text-gray-500">快捷登录</span>
            <div className="border-t border-gray-300 flex-grow"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin("admin")}
              disabled={loginMutation.isPending}
              className="py-2 px-3 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 text-sm"
            >
              管理员
            </button>
            <button
              onClick={() => handleQuickLogin("teacher")}
              disabled={loginMutation.isPending}
              className="py-2 px-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 text-sm"
            >
              教师
            </button>
            <button
              onClick={() => handleQuickLogin("student")}
              disabled={loginMutation.isPending}
              className="py-2 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
            >
              学生
            </button>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>测试账号信息：</p>
          <p>管理员: admin / admin123</p>
          <p>教师: t001 / teacher123</p> 
          <p>学生: 20231001111 / student123</p>
        </div>
      </div>
    </main>
  );
}
