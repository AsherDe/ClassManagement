"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type Post = {
  id: number;
  title: string;
  content: string | null;
  author_id: number;
  post_type: string;
  status: string;
  class_id: number | null;
  target_audience: string | null;
  attachments: unknown;
  priority: string;
  publish_date: Date | null;
  created_at: Date;
  updated_at: Date;
  author: {
    id: number;
    username: string;
    email: string;
    user_type: string;
  };
  class: {
    id: number;
    class_name: string;
    class_code: string;
  } | null;
};

export function PostManager({ userId, userType }: { userId: number; userType: string }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("announcement");
  const [classId, setClassId] = useState<number | undefined>();

  const utils = api.useUtils();
  const posts: any[] = []; // Placeholder
  const classes: any[] = []; // Placeholder
  
  const createPost = {
    mutate: (data: any) => {
      // Placeholder
    },
    isPending: false,
  };

  const deletePost = {
    mutate: (data: any) => {
      // Placeholder
    },
    isPending: false,
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">发布信息</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPost.mutate({
              title,
              content,
              author_id: userId,
              post_type: postType,
              class_id: classId,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">类型</label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="announcement">公告</option>
              <option value="assignment">作业</option>
              <option value="event">活动</option>
              <option value="notice">通知</option>
            </select>
          </div>

          {userType === "teacher" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">班级</label>
              <select
                value={classId || ""}
                onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : undefined)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">全部</option>
                {classes?.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={createPost.isPending}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {createPost.isPending ? "发布中..." : "发布"}
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">信息列表</h2>
        <div className="space-y-4">
          {posts?.map((post: Post) => (
            <div key={post.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{post.title}</h3>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {post.post_type}
                  </span>
                  {post.author_id === userId && (
                    <button
                      onClick={() => deletePost.mutate({ id: post.id })}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
              {post.content && (
                <p className="text-gray-600 text-sm mb-2">{post.content}</p>
              )}
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>作者: {post.author.username}</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              {post.class && (
                <div className="mt-2">
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {post.class.class_name}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
