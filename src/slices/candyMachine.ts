import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { type GuardsAndEligibilityType } from "@/utils/types";

interface CandyMachineState {
  isLoading?: boolean;
  items: {
    available: number;
    remaining: number;
    redeemed: number;
  };
  guardsAndEligibility?: GuardsAndEligibilityType;
}

export interface RootState {
  value: number;
  walletBalance?: number;
  cm?: Record<string, CandyMachineState>;
}

const initialState: RootState = {
  value: 0,
  cm: {},
};

// export const fetchCandyMachine = createAsyncThunk(
//   "candyMachine/fetchCandyMachine",
//   async (candyMachineId: string) => {
//     try {
//         const key = new PublicKey(candyMachineId);
//       // Call your external API here to fetch the candy machine data

//     //   const response = await fetch(`https://your-api-url/candyMachine/${id}`);
//     //   const data = await response.json();

//     //   // Return the fetched candy machine data to be stored in the state
//     //   return data;
//     return "data"
//     } catch (error) {
//       // Handle any error that occurred during the API call
//       console.error("Error fetching candy machine:", error);
//       throw error;
//     }
//   }
// );

export const candyMachineSlice = createSlice({
  name: "candyMachine",
  initialState,
  reducers: {
    increment: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
      //   state.cm["1"]?.candies = 2;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { increment, decrement, incrementByAmount } =
  candyMachineSlice.actions;

// export const selectCandyMachine = (state) => state.candyMachine.cm;
// export const selectCandyMachine = (state: RootState) => state.cm;
// export const selectCandyMachine = (id: string) => (state: RootState) => {
//     return state.cm[id];
// }
// export const selectCandyMachine = (id: string) =>
//   createSelector(
//     (state: RootState) => state.candyMachines[id],
//     (candyMachine) => candyMachine
//   );
export const selectCandyMachine = createSelector(
  [(state: RootState) => state.cm, (state: RootState, id: string) => id],
  (cm, id) => cm?.[id]
);

export const selectAllCandymachines = (state: RootState) => state.cm;

// const items = selectItemsByCategory(state, 'javascript');
// // Another way if you're using redux hook:
// const items = useSelector(state => selectItemsByCategory(state, 'javascript'));
export default candyMachineSlice.reducer;
