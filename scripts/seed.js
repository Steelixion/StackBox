import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Load env variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedDatabase() {
  console.log('Reading local data...');
  
  const rawData = fs.readFileSync('db.json', 'utf8');
  const data = JSON.parse(rawData);

  console.log('Seeding items...');

  const { data: insertedItems, error: itemError } = await supabase
    .from('items')
    .insert(data.qrCodes.map(item => ({
      name: item.item,
      discription: "Batch: " + item.batch,
      count: item.qty || 0,
    })))
    .select();

  if (itemError) {
    console.error('Error seeding items:', itemError);
    return;
  }

  console.log(`Successfully seeded ${insertedItems.length} items!`);
}

seedDatabase();