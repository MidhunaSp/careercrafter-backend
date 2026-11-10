import axios from "axios"
import { API_SERVER_URL_DEV } from "../../../config"

export const FETCH_RESUMES = 'FETCH_RESUMES'
export const CLEAR_RESUMES = 'CLEAR_RESUMES'

export const getResumes = (jobSeekerId) => async (dispatch) => {
    const response = await axios.get(
        `${API_SERVER_URL_DEV}/api/resume/jobseeker/${jobSeekerId}`,
        {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        })
    dispatch({
        type: FETCH_RESUMES,
        payload: response.data
    })
}

// uploads the pdf, then loads the list again. returns the id of the new resume
export const uploadResume = (jobSeekerId, file, label) => async (dispatch) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("label", label)
    const response = await axios.post(
        `${API_SERVER_URL_DEV}/api/resume/upload/${jobSeekerId}`, formData,
        {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        })
    await dispatch(getResumes(jobSeekerId))
    return response.data.id
}

export const updateResume = (id, jobSeekerId, dto) => async (dispatch) => {
    await axios.put(`${API_SERVER_URL_DEV}/api/resume/${id}`, dto,
        {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        })
    await dispatch(getResumes(jobSeekerId))
}

// the default resume changes for all the resumes, so load the list again
export const makeDefaultResume = (id, jobSeekerId) => async (dispatch) => {
    await axios.put(`${API_SERVER_URL_DEV}/api/resume/${id}/default`, {},
        {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        })
    await dispatch(getResumes(jobSeekerId))
}

// a new default can be chosen by the server, so load the list again
export const deleteResume = (id, jobSeekerId) => async (dispatch) => {
    await axios.delete(`${API_SERVER_URL_DEV}/api/resume/${id}`,
        {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        })
    await dispatch(getResumes(jobSeekerId))
}

export const shareResume = (id, shared, jobSeekerId) => async (dispatch) => {
    await axios.put(`${API_SERVER_URL_DEV}/api/resume/${id}/share?shared=${shared}`, {},
        {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        })
    await dispatch(getResumes(jobSeekerId))
}