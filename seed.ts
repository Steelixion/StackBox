import { supabase } from './src/lib/supabaseClient'; // Adjust path to your client file

async function seed() {
    console.log('--- 🏁 Starting Database Seed ---');

    // 1. Clear existing data (Optional: remove if you want to keep existing data)
    // Order matters if you have Foreign Key constraints!
    const tables = ['system_alerts', 'shipments', 'invoice_review_queue', 'restock_suggestions', 'market_graph_data', 'inventory'];
    for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) console.error(`Error clearing ${table}:`, error.message);
    }

    // 2. Seed System Alerts
    await supabase.from('system_alerts').insert([
        { message: 'Critical: Port congestion in Long Beach', severity: 'error' },
        { message: 'SKU-992 stock falling below safety margin', severity: 'warning' },
        { message: 'API integration with Carrier X is healthy', severity: 'info' },
    ]);

    // 3. Seed Shipments
    await supabase.from('shipments').insert([
        { status: 'In-Transit', origin: 'Hong Kong', destination: 'Los Angeles' },
        { status: 'In-Transit', origin: 'Rotterdam', destination: 'New York' },
        { status: 'In-Transit', origin: 'Singapore', destination: 'Savannah' },
        { status: 'Delivered', origin: 'Hamburg', destination: 'London' },
    ]);

    // 4. Seed Invoice Review Queue
    await supabase.from('invoice_review_queue').insert([
        { vendor: 'Maersk Line', amount: 15400.00 },
        { vendor: 'DHL Express', amount: 890.50 },
        { vendor: 'FedEx Trade Networks', amount: 2100.00 },
    ]);

    // 5. Seed Restock Suggestions
    await supabase.from('restock_suggestions').insert([
        { item_name: 'Solar Panel Type A', quantity: 50, approved: false },
        { item_name: 'Lithium Battery 100Ah', quantity: 25, approved: false },
        { item_name: 'Aluminum Mounting Brackets', quantity: 200, approved: true },
    ]);

    // 6. Seed Inventory (For Total Stock Units KPI)
    await supabase.from('inventory').insert([
        { item_name: 'Warehouse A Stock', quantity: 25000 },
        { item_name: 'Warehouse B Stock', quantity: 15231 },
        { item_name: 'Showroom Floor', quantity: 5000 },
    ]);

    // 7. Seed Market Graph Data
    const graphData = Array.from({ length: 12 }, (_, i) => ({
        date: new Date(2024, i, 1).toISOString().split('T')[0],
        value: Math.floor(Math.random() * (6000 - 4000 + 1) + 4000),
    }));
    await supabase.from('market_graph_data').insert(graphData);

    console.log('--- ✅ Seed Complete! ---');
}

seed().catch((err) => {
    console.error('Seed script failed:', err);
    process.exit(1);
});