import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
// import type { PayloadAction } from "@reduxjs/toolkit";

export interface RootState {
  onrampModal: boolean;
  stripeSecret: string | null;
}

const initialState: RootState = {
  onrampModal: false,
  stripeSecret: null,
};

export const onrampSlice = createSlice({
  name: "onramp",
  initialState,
  reducers: {
    open: (state) => {
      state.onrampModal = true;
    },
    close: (state) => {
      state.onrampModal = false;
    },
    setStripeSecret: (state, action: PayloadAction<string | null>) => {
      state.stripeSecret = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { open, close, setStripeSecret } = onrampSlice.actions;

export const selectOnrampModal = (state: { onramp: RootState }) =>
  state.onramp.onrampModal;

export const selectStripeSecret = (state: { onramp: RootState }) =>
  state.onramp.stripeSecret;

export default onrampSlice.reducer;
