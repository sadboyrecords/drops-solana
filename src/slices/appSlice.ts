import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface RootState {
  authModal: boolean;
  publicAddress: string | undefined | null;
}

const initialState: RootState = {
  authModal: false,
  publicAddress: null,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    open: (state) => {
      state.authModal = true;
    },
    close: (state) => {
      state.authModal = false;
    },
    setPublicAddress: (state, action: PayloadAction<string | null>) => {
      state.publicAddress = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { open, close, setPublicAddress } = appSlice.actions;

export const selectAuthModal = (state: { app: RootState }) =>
  state.app.authModal;

export const selectPublicAddress = (state: { app: RootState }) =>
  state.app.publicAddress;

export default appSlice.reducer;
