import { Link } from "react-router-dom";

const App = () => {
  return (
    <div className="container">
      <h1>Welcome to Chat App</h1>
      <p>Join the chat by registering or logging in.</p>
      <div className="buttons">
        <Link to="/register">
          <button>Register</button>
        </Link>
        <Link to="/login">
          <button>Login</button>
        </Link>
      </div>
    </div>
  );
};

export default App;
