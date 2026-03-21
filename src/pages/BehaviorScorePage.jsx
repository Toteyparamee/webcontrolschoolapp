import BehaviorManagement from '../components/BehaviorManagement';
import Sidebar from '../components/Sidebar';

const BehaviorScorePage = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-container">
          <BehaviorManagement />
        </div>
      </div>
    </div>
  );
};

export default BehaviorScorePage;
