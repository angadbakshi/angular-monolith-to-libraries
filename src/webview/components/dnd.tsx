// import React from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// export const DependencyGraph: React.FC<{ data: any }> = ({ data }) => {
//     // Implementation using a force-directed graph visualization
//     return (
//         <div className="h-96 w-full">
//             <ResponsiveContainer children={undefined}>
//                 {/* Force-directed graph visualization */}
//             </ResponsiveContainer>
//         </div>
//     );
// };

// export const ModuleSizeChart: React.FC<{ data: any }> = ({ data }) => {
//     const chartData = Object.entries(data.moduleSizes).map(([name, size]) => ({
//         name,
//         size: Math.round(size / 1024) // Convert to KB
//     }));

//     return (
//         <div className="h-64 w-full">
//             <ResponsiveContainer>
//                 <LineChart data={chartData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="name" />
//                     <YAxis label={{ value: 'Size (KB)', angle: -90, position: 'insideLeft' }} />
//                     <Tooltip />
//                     <Line type="monotone" dataKey="size" stroke="#8884d8" />
//                 </LineChart>
//             </ResponsiveContainer>
//         </div>
//     );
// };

// export const CouplingMetricsChart: React.FC<{ data: any }> = ({ data }) => {
//     const chartData = Object.keys(data.afferentCoupling).map(module => ({
//         name: module,
//         afferent: data.afferentCoupling[module],
//         efferent: data.efferentCoupling[module],
//         instability: data.instability[module]
//     }));

//     return (
//         <div className="h-64 w-full">
//             <ResponsiveContainer>
//                 <LineChart data={chartData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="name" />
//                     <YAxis />
//                     <Tooltip />
//                     <Line type="monotone" dataKey="afferent" stroke="#8884d8" name="Afferent Coupling" />
//                     <Line type="monotone" dataKey="efferent" stroke="#82ca9d" name="Efferent Coupling" />
//                     <Line type="monotone" dataKey="instability" stroke="#ffc658" name="Instability" />
//                 </LineChart>
//             </ResponsiveContainer>
//         </div>
//     );
// };