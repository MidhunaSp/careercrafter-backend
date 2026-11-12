import { configureStore } from "@reduxjs/toolkit"
import ResumeReducer from "./reducers/ResumeReducer"

export const store = configureStore({
    reducer: ResumeReducer
})