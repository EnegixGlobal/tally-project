# Company Context Solution - Complete Guide

## Overview

This solution provides a robust, centralized company management system using React Context API that ensures `companyInfo` always stays in sync with `active_company_id`.

## Key Features

✅ **Auto-sync on page reload** - `companyInfo` automatically syncs with `active_company_id`  
✅ **Guaranteed consistency** - `companyInfo` always matches the selected company  
✅ **Safe localStorage handling** - Error handling for corrupted or missing data  
✅ **API fallback** - Fetches company data from API if not found locally  
✅ **Clean switch function** - Simple API for switching companies  
✅ **Error handling** - Graceful error handling if company not found  

## Architecture

### File Structure

```
frontend/src/
├── context/
│   ├── CompanyContext.tsx    # Main company management context
│   └── AppContext.tsx         # App context (synced with CompanyContext)
├── components/
│   ├── dashboard/
│   │   └── Dashboard.tsx     # Uses CompanyContext for switching
│   ├── company/
│   │   └── CompanyForm.tsx   # Uses CompanyContext when creating companies
│   └── layout/
│       └── Header.tsx         # Uses CompanyContext for active company
└── utils/
    └── companyApiExample.ts  # Examples of using company_id in API calls
```

## localStorage Structure

The solution uses the following localStorage keys:

- `companies` - JSON string array of all companies: `"[{id:1,name:'A'}, {id:10,name:'B'}]"`
- `active_company_id` - Current active company ID: `"1"`
- `companyInfo` - JSON string of currently active company: `"{id:1,name:'A',...}"`

**Backward Compatibility**: The solution also supports the legacy `company_id` key.

## Usage

### 1. Basic Setup

The `CompanyProvider` is already wrapped in `App.tsx`:

```tsx
<AuthProvider>
  <CompanyProvider>
    <AppProvider>
      {/* Your app */}
    </AppProvider>
  </CompanyProvider>
</AuthProvider>
```

### 2. Switching Companies

```tsx
import { useCompany } from '../context/CompanyContext';

function MyComponent() {
  const { switchCompany, companyInfo, activeCompanyId } = useCompany();

  const handleSwitch = async () => {
    try {
      await switchCompany(10); // Switch to company with ID 10
      // companyInfo will automatically update to match company 10
    } catch (error) {
      console.error('Failed to switch company:', error);
    }
  };

  return (
    <div>
      <p>Current Company: {companyInfo?.name}</p>
      <button onClick={handleSwitch}>Switch Company</button>
    </div>
  );
}
```

### 3. Using Company ID in API Calls

```tsx
import { useCompany } from '../context/CompanyContext';

function VoucherList() {
  const { activeCompanyId } = useCompany();

  useEffect(() => {
    if (!activeCompanyId) return;

    fetch(`${API_URL}/api/vouchers?company_id=${activeCompanyId}`)
      .then(res => res.json())
      .then(data => {
        // Handle data
      });
  }, [activeCompanyId]);

  return <div>...</div>;
}
```

### 4. Accessing Company Info

```tsx
import { useCompany } from '../context/CompanyContext';
// OR
import { useAppContext } from '../context/AppContext';

function MyComponent() {
  // Option 1: Direct from CompanyContext
  const { companyInfo, activeCompanyId } = useCompany();

  // Option 2: From AppContext (synced automatically)
  const { companyInfo } = useAppContext();

  return (
    <div>
      <h1>{companyInfo?.name}</h1>
      <p>GST: {companyInfo?.gstNumber}</p>
      <p>PAN: {companyInfo?.panNumber}</p>
    </div>
  );
}
```

## How It Works

### Auto-Sync Logic

1. **On App Load**:
   - Loads `companies` array from localStorage
   - Loads `active_company_id` from localStorage
   - Automatically syncs `companyInfo` to match `active_company_id`

2. **When Switching Companies**:
   - Updates `active_company_id` in state and localStorage
   - Finds company in `companies` array
   - Updates `companyInfo` to match the selected company
   - Saves updated `companyInfo` to localStorage

3. **Sync Priority**:
   - First: Check if `companyInfo` in localStorage matches `active_company_id`
   - Second: Find company in `companies` array
   - Third: Fetch from API if not found locally
   - Last: Show error if company not found

### Error Handling

- **Company not found**: Sets error state, clears `companyInfo`
- **Corrupted localStorage**: Falls back to empty array/null, logs error
- **API failure**: Logs error, continues with available data

## API Integration Example

See `frontend/src/utils/companyApiExample.ts` for complete examples of:
- Fetching data with company_id
- Creating records with company_id
- Using company_id in React components

## Best Practices

1. **Always use `switchCompany()`** instead of directly updating localStorage
2. **Use `activeCompanyId` from context** instead of reading localStorage directly
3. **Include `company_id` in all API calls** that are company-specific
4. **Handle loading states** when `isLoading` is true
5. **Display errors** when `error` is not null

## Testing Checklist

- [ ] Switch company updates `active_company_id`
- [ ] Switch company updates `companyInfo` to match
- [ ] Page reload maintains correct company
- [ ] `companyInfo` syncs correctly on app load
- [ ] Error handling works when company not found
- [ ] API calls use correct `company_id`

## Migration Notes

If you have existing code that directly accesses localStorage:

**Before:**
```tsx
const companyId = localStorage.getItem('company_id');
const companyInfo = JSON.parse(localStorage.getItem('companyInfo') || 'null');
```

**After:**
```tsx
const { activeCompanyId, companyInfo } = useCompany();
```

This ensures your code always uses the correct, synced company data.

