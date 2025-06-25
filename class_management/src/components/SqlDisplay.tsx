"use client";
import { useState } from "react";

interface SqlDisplayProps {
  title: string;
  sql: string;
  data: any[];
  columns: { key: string; label: string; type?: 'text' | 'number' | 'ranking' }[];
}

export default function SqlDisplay({ title, sql, data, columns }: SqlDisplayProps) {
  const [showSql, setShowSql] = useState(false);

  const formatValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'ranking':
        return `#${value}`;
      default:
        return value;
    }
  };

  const getRankingColor = (ranking: number) => {
    if (ranking === 1) return 'text-yellow-600 bg-yellow-50';
    if (ranking === 2) return 'text-gray-600 bg-gray-50';
    if (ranking === 3) return 'text-orange-600 bg-orange-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button
          onClick={() => setShowSql(!showSql)}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
        >
          {showSql ? '隐藏SQL' : '显示SQL'}
        </button>
      </div>

      {showSql && (
        <div className="mb-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre className="whitespace-pre-wrap">{sql}</pre>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                    {column.type === 'ranking' ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankingColor(row[column.key])}`}>
                        {formatValue(row[column.key], column.type)}
                      </span>
                    ) : (
                      <span className={column.type === 'number' ? 'font-medium text-gray-900' : 'text-gray-900'}>
                        {formatValue(row[column.key], column.type)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          暂无数据
        </div>
      )}
    </div>
  );
}