/**
 * Interactive Stock Price Chart Component using ag-charts-react
 */
import { useState, useEffect } from 'react';
import { AgCharts } from 'ag-charts-react';
import { AgChartOptions } from 'ag-charts-community';
import { apiClient } from '@/lib/api';
import type { StockHistoryResponse, StockPriceHistory } from '@/types/api';

interface StockPriceChartProps {
  stockId: number;
  stockSymbol: string;
  stockName?: string;
  height?: number;
}

type TimeRange = '24h' | '7d' | '30d';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

export const StockPriceChart = ({
  stockId,
  stockSymbol,
  stockName,
  height = 400,
}: StockPriceChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [chartData, setChartData] = useState<StockPriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response: StockHistoryResponse = await apiClient.getStockHistory(
          stockId,
          timeRange
        );
        setChartData(response.history);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch stock price history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stockId, timeRange]);

  // Transform data for ag-charts
  const transformedData = chartData.map((item) => ({
    timestamp: new Date(item.timestamp),
    price: Number(item.price),
  }));

  // Calculate price change for color indication
  const priceChange =
    transformedData.length > 1
      ? transformedData[transformedData.length - 1].price - transformedData[0].price
      : 0;
  const isPositive = priceChange >= 0;

  const chartOptions: AgChartOptions = {
    data: transformedData,
    title: {
      text: stockName ? `${stockName} (${stockSymbol})` : stockSymbol,
      fontSize: 18,
      fontWeight: 'bold',
    },
    subtitle: {
      text:
        transformedData.length > 0
          ? `Price: $${transformedData[transformedData.length - 1].price.toFixed(2)} (${isPositive ? '+' : ''}${priceChange.toFixed(2)})`
          : 'Loading...',
      fontSize: 14,
      color: isPositive ? '#10b981' : '#ef4444',
    },
    series: [
      {
        type: 'line',
        xKey: 'timestamp',
        yKey: 'price',
        stroke: isPositive ? '#10b981' : '#ef4444',
        strokeWidth: 2,
        marker: {
          enabled: true,
          size: 4,
          fill: isPositive ? '#10b981' : '#ef4444',
        },
        tooltip: {
          renderer: ({ datum, xKey, yKey }) => {
            const date = datum[xKey] as Date;
            const price = datum[yKey] as number;
            return {
              title: date.toLocaleString(),
              content: `$${price.toFixed(2)}`,
            };
          },
        },
      },
    ],
    axes: [
      {
        type: 'time',
        position: 'bottom',
        title: {
          text: 'Time',
        },
        label: {
          format: timeRange === '24h' ? '%H:%M' : '%b %d',
        },
      },
      {
        type: 'number',
        position: 'left',
        title: {
          text: 'Price ($)',
        },
        label: {
          formatter: ({ value }) => `$${value.toFixed(2)}`,
        },
      },
    ],
    legend: {
      enabled: false,
    },
    background: {
      fill: 'transparent',
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-gray-500">No data available for this time range</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Time Range Selector */}
      <div className="flex gap-2 mb-4 justify-end">
        {TIME_RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setTimeRange(option.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        <AgCharts options={chartOptions} />
      </div>
    </div>
  );
};
