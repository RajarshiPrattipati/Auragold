/**
 * Mini Stock Price Chart Component - Compact preview for stock cards
 */
import { useState, useEffect } from 'react';
import { AgCharts } from 'ag-charts-react';
import { AgChartOptions } from 'ag-charts-community';
import { apiClient } from '@/lib/api';
import type { StockHistoryResponse, StockPriceHistory } from '@/types/api';

interface StockMiniChartProps {
  stockId: string;
  height?: number;
}

export const StockMiniChart: React.FC<StockMiniChartProps> = ({
  stockId,
  height = 80,
}) => {
  const [data, setData] = useState<StockPriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch 1 week of data for mini chart
        const response = await apiClient.getStockHistory(parseInt(stockId), '7d');

        if (response.history && response.history.length > 0) {
          setData(response.history);
        } else {
          setError('No data available');
        }
      } catch (err) {
        console.error('Error fetching mini chart data:', err);
        setError('Failed to load chart');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stockId]);

  if (loading) {
    return (
      <div
        style={{ height: `${height}px` }}
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded animate-pulse"
      >
        <div className="text-xs text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div
        style={{ height: `${height}px` }}
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded"
      >
        <div className="text-xs text-gray-400">No chart data</div>
      </div>
    );
  }

  // Determine if price is going up or down
  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const isPositive = lastPrice >= firstPrice;
  const lineColor = isPositive ? '#10b981' : '#ef4444'; // green-500 or red-500

  const chartOptions: AgChartOptions = {
    data: data.map((item) => ({
      // Ensure correct types for charting
      timestamp: new Date(item.timestamp),
      price: Number(item.price),
    })),
    series: [
      {
        type: 'line',
        xKey: 'timestamp',
        yKey: 'price',
        stroke: lineColor,
        strokeWidth: 2,
        marker: { enabled: false },
      },
    ],
    axes: [
      {
        type: 'time',
        position: 'bottom',
        label: { enabled: false },
        gridLine: { enabled: false },
        line: { enabled: false },
        tick: { enabled: false },
      },
      {
        type: 'number',
        position: 'right',
        label: { enabled: false },
        gridLine: { enabled: false },
        line: { enabled: false },
        tick: { enabled: false },
      },
    ],
    height,
    padding: {
      top: 5,
      right: 5,
      bottom: 5,
      left: 5,
    },
    background: {
      visible: false,
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      enabled: false, // Disable tooltip for mini chart
    },
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <AgCharts options={chartOptions} />
    </div>
  );
};
