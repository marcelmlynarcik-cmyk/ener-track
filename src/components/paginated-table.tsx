'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginatedTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | 'actions';
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  itemsPerPage?: number;
  emptyMessage?: string;
}

export function PaginatedTable<T extends { id: string }>(
  {
    data,
    columns,
    itemsPerPage = 10,
    emptyMessage = 'Žiadne záznamy.',
  }: PaginatedTableProps<T>
) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = data.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  if (data.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  scope="col"
                  className={`px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.map((item, itemIndex) => {
              if (!item || typeof item.id === 'undefined') {
                return <tr key={`invalid-${itemIndex}`}><td>Invalid item data</td></tr>;
              }

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors odd:bg-slate-50/50">
                  {columns.map((column, columnIndex) => (
                    <td
                      key={`${item.id}-${column.key as string}-${columnIndex}`}
                      className={`px-4 py-3 whitespace-nowrap text-sm text-slate-600 ${column.className || ''}`}
                    >
                      {column.render ? column.render(item) : column.key !== 'actions' ? (item[column.key as keyof T] as React.ReactNode) : null}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="text-slate-500 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Predchádzajúca
          </Button>
          <span className="text-xs font-medium text-slate-400">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="text-slate-500 hover:text-slate-900"
          >
            Ďalšia
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
