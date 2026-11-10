import { configureStore } from "@reduxjs/toolkit"
import ResumeReducer from "./reducers/ResumeReducer"

// redux is used only for the Resume module (resume database of the job seeker)
export const store = configureStore({
    reducer: ResumeReducer
})