// lib/export-utils.ts
import { CountEntry } from "@/lib/types";

export const exportVehicleData = (entries: CountEntry[]) => {
    const categories = ['cut_through', 'parking', 'driving'];

    categories.forEach((category) => {
        const filteredEntries = entries.filter((e) => e.category === category);

        if (filteredEntries.length === 0) return; // Skip empty categories

        // Custom string formatter
        let csvContent = "";
        filteredEntries.forEach((entry) => {
            // If it's a Car, append nothing. Otherwise, append (Type).
            const typeModifier = entry.type === 'Car' ? '' : ` (${entry.type})`;
            csvContent += `${entry.timestamp},${typeModifier}\n`;
        });

        // Generate Blob
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${category}_counts.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
};