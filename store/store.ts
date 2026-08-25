import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./authSlice";
import customerCacheReducer from "./customerCacheSlice";
import providerCacheReducer from "./providerCacheSlice";

export const store = configureStore({
	reducer: {
		auth: authReducer,
		customerCache: customerCacheReducer,
		providerCache: providerCacheReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
