import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import { Toaster } from "sonner";
import { PageTitleHandler } from "./hooks/usePageTitle";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CitiesList from "./pages/cities/CitiesList";
import BuildingsList from "./pages/buildings/BuildingsList";
import BuildingCreate from "./pages/buildings/BuildingCreate";
import BuildingEdit from "./pages/buildings/BuildingEdit";
import BuildingInfo from "./pages/buildings/BuildingInfo";
import HomesList from "./pages/homes/HomesList";
import HomeCreate from "./pages/homes/HomeCreate";
import ClientsList from "./pages/clients/ClientsList";
import ContractsList from "./pages/contracts/ContractsList";
import ContractCreate from "./pages/contracts/ContractCreate";
import ContractEdit from "./pages/contracts/ContractEdit";
import ContractSchedule from "./pages/contracts/ContractSchedule";
import LeadsPage from "./pages/leads/LeadsPage";
import LeadsKanban from "./pages/leads/LeadsKanban";
import LeadsList from "./pages/leads/LeadsList";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import UsersPage from "./pages/users/UsersPage";
import ExpensesList from "./pages/expenses/ExpensesList";
import ExpenseCategories from "./pages/expenses/ExpenseCategories";
import ExpenseCategoryDetails from "./pages/expenses/ExpenseCategoryDetails";
import BuildingExpenses from "./pages/expenses/BuildingExpenses";
import SmsPage from "./pages/sms/SmsPage";
import FormsPage from "./pages/forms/FormsPage";
import IncomesList from "./pages/incomes/IncomesList";
import IncomeCategories from "./pages/incomes/IncomeCategories";
import IncomeCategoryDetails from "./pages/incomes/IncomeCategoryDetails";
import BuildingIncomes from "./pages/incomes/BuildingIncomes";
import PublicFormPage from "./pages/forms/PublicFormPage";
import "./index.css";

// Layout wrapper for protected routes
const ProtectedLayout = ({ children, permission }) => (
  <ProtectedRoute requiredPermission={permission}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <BrowserRouter>
            <PageTitleHandler />
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedLayout>
                    <Dashboard />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedLayout permission="can_view_analytics">
                    <AnalyticsPage />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/sms"
                element={<Navigate to="/" replace />}
              />
              <Route
                path="/users"
                element={
                  <ProtectedLayout permission="can_view_users">
                    <UsersPage />
                  </ProtectedLayout>
                }
              />

              {/* Cities - modal based */}
              <Route
                path="/cities"
                element={
                  <ProtectedLayout>
                    <CitiesList />
                  </ProtectedLayout>
                }
              />

              {/* Buildings - modal based */}
              <Route
                path="/buildings/info"
                element={
                  <ProtectedLayout permission="can_view_buildings_info">
                    <BuildingInfo />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/buildings"
                element={
                  <ProtectedLayout>
                    <BuildingsList />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/buildings/create"
                element={
                  <ProtectedLayout>
                    <BuildingCreate />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/buildings/:id/edit"
                element={
                  <ProtectedLayout>
                    <BuildingEdit />
                  </ProtectedLayout>
                }
              />

              {/* Homes */}
              <Route
                path="/homes"
                element={
                  <ProtectedLayout>
                    <HomesList />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/homes/create"
                element={
                  <ProtectedLayout>
                    <HomeCreate />
                  </ProtectedLayout>
                }
              />

              <Route
                path="/clients"
                element={
                  <ProtectedLayout>
                    <ClientsList />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/contracts"
                element={
                  <ProtectedLayout>
                    <ContractsList />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/contracts/create"
                element={
                  <ProtectedLayout>
                    <ContractCreate />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/contracts/:id/edit"
                element={
                  <ProtectedLayout>
                    <ContractEdit />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/contracts/:id/schedule"
                element={
                  <ProtectedLayout>
                    <ContractSchedule />
                  </ProtectedLayout>
                }
              />

              <Route
                path="/leads"
                element={
                  <ProtectedLayout permission="can_view_leads">
                    <LeadsPage />
                  </ProtectedLayout>
                }
              >
                <Route index element={<Navigate to="kanban" replace />} />
                <Route path="kanban" element={<LeadsKanban />} />
                <Route path="list" element={<LeadsList />} />
              </Route>

              {/* Chiqimlar */}
              <Route
                path="/expenses"
                element={
                  <ProtectedLayout permission="can_view_expenses">
                    <ExpensesList />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/expense-categories"
                element={
                  <ProtectedLayout permission="can_view_expenses">
                    <ExpenseCategories />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/expense-categories/:id"
                element={
                  <ProtectedLayout permission="can_view_expenses">
                    <ExpenseCategoryDetails />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/expenses/buildings"
                element={
                  <ProtectedLayout permission="can_view_expenses">
                    <BuildingExpenses />
                  </ProtectedLayout>
                }
              />

              {/* Kirimlar */}
              <Route
                path="/incomes"
                element={
                  <ProtectedLayout permission="can_view_incomes">
                    <IncomesList />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/incomes/categories"
                element={
                  <ProtectedLayout permission="can_view_incomes">
                    <IncomeCategories />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/incomes/categories/:id"
                element={
                  <ProtectedLayout permission="can_view_incomes">
                    <IncomeCategoryDetails />
                  </ProtectedLayout>
                }
              />
              <Route
                path="/incomes/buildings"
                element={
                  <ProtectedLayout permission="can_view_incomes">
                    <BuildingIncomes />
                  </ProtectedLayout>
                }
              />

              {/* Forms */}
              <Route
                path="/forms"
                element={
                  <ProtectedLayout permission="can_view_forms">
                    <FormsPage />
                  </ProtectedLayout>
                }
              />

              {/* Public Form - No Authentication */}
              <Route path="/f/:slug" element={<PublicFormPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              duration: 3000,
              className: "custom-toast",
            }}
          />
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Coming Soon placeholder
const ComingSoon = ({ title }) => (
  <div
    style={{
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: "80px",
        height: "80px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "24px",
        boxShadow: "0 10px 30px rgba(99, 102, 241, 0.3)",
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    </div>
    <h2
      style={{
        fontSize: "28px",
        fontWeight: "700",
        color: "var(--text-primary)",
        margin: "0 0 12px",
      }}
    >
      {title}
    </h2>
    <p
      style={{
        fontSize: "16px",
        color: "var(--text-secondary)",
        margin: "0",
      }}
    >
      Bu bo'lim tez orada qo'shiladi
    </p>
  </div>
);

export default App;
