'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DataPoint {
  day: string;
  listings: number;
}

export function UsageChart({ data }: { data: DataPoint[] }) {
  const max = Math.max(...data.map((d) => d.listings), 1);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(240 5% 60%)' }} />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: 'hsl(240 4% 18% / 0.5)', radius: 4 }}
          contentStyle={{ background: 'hsl(222 39% 10%)', border: '1px solid hsl(240 4% 18%)', borderRadius: 8, fontSize: 12 }}
          itemStyle={{ color: 'hsl(0 0% 97%)' }}
          labelStyle={{ color: 'hsl(240 5% 60%)', marginBottom: 2 }}
        />
        <Bar dataKey="listings" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.listings === max && max > 0 ? 'hsl(217 91% 60%)' : 'hsl(240 4% 18%)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
