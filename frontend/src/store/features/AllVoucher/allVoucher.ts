import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface AllVoucherState {
    saleVoucher: any[];
    purchaseVoucher: any[];
    paymentVoucher: any[];
    receiptVoucher: any[];
    contraVoucher: any[];
    journalVoucher: any[];
    salesOrderVoucher: any[];
    purchaseOrderVoucher: any[];
    quotationVoucher: any[];
    debitNoteVoucher: any[];
    creditNoteVoucher: any[];
    stockJournalVoucher: any[];
    payrollVoucher: any[];
    deliveryNoteVoucher: any[];
    loading: boolean;
    error: string | null;
}

export interface AllVoucherPayload {
    saleVoucher: any[];
    purchaseVoucher: any[];
    paymentVoucher: any[];
    receiptVoucher: any[];
    contraVoucher: any[];
    journalVoucher: any[];
    salesOrderVoucher: any[];
    purchaseOrderVoucher: any[];
    quotationVoucher: any[];
    debitNoteVoucher: any[];
    creditNoteVoucher: any[];
    stockJournalVoucher: any[];
    payrollVoucher: any[];
    deliveryNoteVoucher: any[];
}

const initialState: AllVoucherState = {
    saleVoucher: [],
    purchaseVoucher: [],
    paymentVoucher: [],
    receiptVoucher: [],
    contraVoucher: [],
    journalVoucher: [],
    salesOrderVoucher: [],
    purchaseOrderVoucher: [],
    quotationVoucher: [],
    debitNoteVoucher: [],
    creditNoteVoucher: [],
    stockJournalVoucher: [],
    payrollVoucher: [],
    deliveryNoteVoucher: [],
    loading: false,
    error: null,
};

interface FetchVouchersParams {
    companyId: string | number;
    ownerType: string;
    ownerId: string | number;
}

export const fetchAllVouchers = createAsyncThunk<AllVoucherPayload, FetchVouchersParams>(
    "allVoucher/fetchAllVouchers",
    async ({ companyId, ownerType, ownerId }, { rejectWithValue }) => {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        console.log("fetchAllVouchers params:", { companyId, ownerType, ownerId });

        const params = { companyId, ownerType, ownerId };
        const paramsUnderScore = { company_id: companyId, owner_type: ownerType, owner_id: ownerId };
        const commonParams = {
            companyId,
            company_id: companyId,
            ownerType,
            owner_type: ownerType,
            ownerId,
            owner_id: ownerId,
        };

        const getData = (res: any) => {
            if (!res || !res.data) return [];
            const data = res.data;
            // Handle different response structures: { success: true, data: [...] } or just [...]
            if (data.success && Array.isArray(data.data)) return data.data;
            if (Array.isArray(data.data)) return data.data;
            if (Array.isArray(data)) return data;
            return [];
        };

        const fetchSafe = async (url: string, p: any) => {
            try {
                const response = await axios.get(`${apiUrl}${url}`, { params: p });
                return getData(response);
            } catch (err) {
                console.warn(`Failed to fetch from ${apiUrl}${url}:`, err);
                return [];
            }
        };

        try {
            const [
                saleVoucher,
                purchaseVoucher,
                paymentVoucher,
                receiptVoucher,
                contraVoucher,
                journalVoucher,
                salesOrderVoucher,
                purchaseOrderVoucher,
                quotationVoucher,
                debitNoteVoucher,
                creditNoteVoucher,
                stockJournalVoucher,
                payrollVoucher,
                deliveryNoteVoucher,
            ] = await Promise.all([
                fetchSafe("/api/sale-vouchers", commonParams),
                fetchSafe("/api/purchase-vouchers", commonParams),
                fetchSafe("/api/vouchers", { ...commonParams, voucherType: 'payment' }),
                fetchSafe("/api/vouchers", { ...commonParams, voucherType: 'receipt' }),
                fetchSafe("/api/vouchers", { ...commonParams, voucherType: 'contra' }),
                fetchSafe("/api/vouchers", { ...commonParams, voucherType: 'journal' }),
                fetchSafe("/api/sales-orders", commonParams),
                fetchSafe("/api/purchase-orders", commonParams),
                fetchSafe("/api/vouchers", { ...commonParams, voucherType: 'quotation' }),
                fetchSafe("/api/DebitNoteVoucher", commonParams),
                fetchSafe("/api/CreditNotevoucher", commonParams),
                fetchSafe("/api/StockJournal", commonParams),
                fetchSafe("/api/vouchers", { ...commonParams, voucherType: 'payroll' }),
                fetchSafe("/api/vouchers", { ...commonParams, voucherType: 'delivery-note' }),
            ]);

            return {
                saleVoucher,
                purchaseVoucher,
                paymentVoucher,
                receiptVoucher,
                contraVoucher,
                journalVoucher,
                salesOrderVoucher,
                purchaseOrderVoucher,
                quotationVoucher,
                debitNoteVoucher,
                creditNoteVoucher,
                stockJournalVoucher,
                payrollVoucher,
                deliveryNoteVoucher,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || "Failed to fetch vouchers");
        }
    }
);

export const allVoucherSlice = createSlice({
    name: "allVoucher",
    initialState,
    reducers: {},

    extraReducers: (builder) => {
        builder
            .addCase(fetchAllVouchers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(fetchAllVouchers.fulfilled, (state, action) => {
                state.loading = false;
                state.saleVoucher = action.payload.saleVoucher;
                state.purchaseVoucher = action.payload.purchaseVoucher;
                state.paymentVoucher = action.payload.paymentVoucher;
                state.receiptVoucher = action.payload.receiptVoucher;
                state.contraVoucher = action.payload.contraVoucher;
                state.journalVoucher = action.payload.journalVoucher;
                state.salesOrderVoucher = action.payload.salesOrderVoucher;
                state.purchaseOrderVoucher = action.payload.purchaseOrderVoucher;
                state.quotationVoucher = action.payload.quotationVoucher;
                state.debitNoteVoucher = action.payload.debitNoteVoucher;
                state.creditNoteVoucher = action.payload.creditNoteVoucher;
                state.stockJournalVoucher = action.payload.stockJournalVoucher;
                state.payrollVoucher = action.payload.payrollVoucher;
                state.deliveryNoteVoucher = action.payload.deliveryNoteVoucher;
            })

            .addCase(fetchAllVouchers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default allVoucherSlice.reducer;