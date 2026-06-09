# Fix for Checkbox Persistence Issue

## Problem
When unchecking `Featured` and `Show in Comparison` checkboxes and saving, the values don't persist. After reloading the page, all checkboxes appear checked again.

## Root Cause
The `show_in_comparison` column **does not exist** in the MySQL database `products` table. This causes the value to be ignored when saving, and when fetching the product data, there's no value to display, so it defaults to checked.

## Solution

### Step 1: Add Missing Column to Database

Run the following SQL migration on your MySQL database:

```sql
ALTER TABLE products 
ADD COLUMN show_in_comparison TINYINT(1) NOT NULL DEFAULT 0 
AFTER is_active;
```

**How to run this:**

#### Option A: Using phpMyAdmin (if available)
1. Open phpMyAdmin
2. Select your database
3. Go to SQL tab
4. Paste the SQL above and click "Go"

#### Option B: Using MySQL command line
```bash
mysql -u your_username -p your_database_name < Database/mysql/004_add_show_in_comparison.sql
```

#### Option C: Via MySQL API (if you have access)
Connect to your MySQL server and run the migration file:
```bash
# If you have direct MySQL access
mysql -h localhost -u root -p < /home/bs01463/Documents/ORH/Project/orh/Database/mysql/004_add_show_in_comparison.sql
```

### Step 2: Verify the Fix

After running the migration:

1. Restart your Next.js dev server (if running)
2. Navigate to any product edit page
3. Uncheck "Featured" and "Show in Comparison"
4. Click "Save Changes"
5. Reload the page
6. **Verify**: The checkboxes should now show as unchecked

## Files Modified

1. **`Database/mysql/001_create_tables.sql`** - Updated schema to include `show_in_comparison` column
2. **`Database/mysql/004_add_show_in_comparison.sql`** - Migration file to add the column
3. **`src/lib/api/gateway.ts`** - Already fixed to convert boolean values correctly
4. **`src/app/admin/products/[id]/_components/ProductEditForm.tsx`** - Already fixed to handle boolean values

## Database Schema

The `products` table now includes:
```sql
is_featured          TINYINT(1)   NOT NULL DEFAULT 0,
is_active            TINYINT(1)   NOT NULL DEFAULT 1,
show_in_comparison   TINYINT(1)   NOT NULL DEFAULT 0,
```

## Testing Checklist

- [ ] Run the SQL migration
- [ ] Restart the application
- [ ] Edit a product
- [ ] Uncheck "Featured" checkbox → Save → Reload → Should stay unchecked ✓
- [ ] Uncheck "Show in Comparison" checkbox → Save → Reload → Should stay unchecked ✓
- [ ] Check "Active" checkbox → Save → Reload → Should stay checked ✓
- [ ] Mix of checked/unchecked → Save → Reload → Should persist correctly ✓

## Important Note

The MySQL API server (running on port 4000) needs to have this column in its database. If you're using a separate MySQL instance for the API, make sure to run the migration there as well.
