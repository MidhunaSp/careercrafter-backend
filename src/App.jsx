import { Route, Routes } from "react-router"
import Home from "./components/Home"
import Login from "./components/auth/Login"
import Signup from "./components/auth/Signup"
import PageNotFound from "./components/PageNotFound"
import Notifications from "./components/common/Notifications"
import AdminDashboard from "./components/admin/AdminDashboard"
import AdminJobs from "./components/admin/AdminJobs"
import AdminUsers from "./components/admin/AdminUsers"
import EmployerDashboard from "./components/employer/EmployerDashboard"
import EmployerProfile from "./components/employer/EmployerProfile"
import Applicants from "./components/employer/Applicants"
import CandidateSearch from "./components/employer/CandidateSearch"
import JobSeekerDashboard from "./components/jobseeker/JobSeekerDashboard"
import JobSeekerProfile from "./components/jobseeker/JobSeekerProfile"
import JobSearch from "./components/jobseeker/JobSearch"
import RecommendedJobs from "./components/jobseeker/RecommendedJobs"
import SavedJob from "./components/jobseeker/SavedJob"
import JobSeekerMessages from "./components/jobseeker/JobSeekerMessages"

function App() {
  return (
    <Routes>
      <Route path="" element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />

      <Route path="admin" element={<AdminDashboard />} />
      <Route path="admin/users" element={<AdminUsers />} />
      <Route path="admin/jobs" element={<AdminJobs />} />

      <Route path="employer" element={<EmployerDashboard />} />
      <Route path="employer/applicants" element={<Applicants />} />
      <Route path="employer/candidates" element={<CandidateSearch />} />
      <Route path="employer/notifications" element={<Notifications role="EMPLOYER" />} />
      <Route path="employer/profile" element={<EmployerProfile />} />

      <Route path="jobseeker" element={<JobSeekerDashboard />} />
      <Route path="jobseeker/profile" element={<JobSeekerProfile />} />
      <Route path="jobseeker/jobs" element={<JobSearch />} />
      <Route path="jobseeker/recommended" element={<RecommendedJobs />} />
      <Route path="jobseeker/saved" element={<SavedJob />} />
      <Route path="jobseeker/messages" element={<JobSeekerMessages />} />
      <Route path="jobseeker/notifications" element={<Notifications role="JOB_SEEKER" />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}
export default App