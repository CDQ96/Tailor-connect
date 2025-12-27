import React from 'react';
import { AppProvider, useApp } from './store';
import { AppView } from './types';
import { Layout } from './components/Layout';
import { 
  LandingView, 
  AuthView, 
  CustomerDashboard, 
  TailorDetails,
  MeasurementView,
  TrackingView
} from './components/Views';

const Main = () => {
  const { view } = useApp();

  const renderView = () => {
    switch (view) {
      case AppView.LANDING:
        return <LandingView />;
      case AppView.AUTH:
        return <AuthView />;
      case AppView.CUSTOMER_DASHBOARD:
        return <CustomerDashboard />;
      case AppView.TAILOR_DETAILS:
        return <TailorDetails />;
      case AppView.MEASUREMENT:
        return <MeasurementView />;
      case AppView.TRACKING:
        return <TrackingView />;
      case AppView.TAILOR_DASHBOARD:
        return <div className="text-center py-20 text-xl text-gray-500">Tailor Dashboard (Mock Implementation)</div>;
      default:
        return <LandingView />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
};

const App = () => {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
};

export default App;