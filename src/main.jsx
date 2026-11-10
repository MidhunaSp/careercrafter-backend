import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from "react-router"
import { Provider } from 'react-redux'
import { store } from './store/store.js' 
import ToastProvider from './components/common/ToastProvider.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider store={store}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </Provider>
  </BrowserRouter>
)