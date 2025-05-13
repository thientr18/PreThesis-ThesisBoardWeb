# PreThesis-ThesisBoardWeb

## Overview
PreThesis-ThesisBoardWeb is a web-based application designed to manage and streamline the thesis process for students, teachers, moderators, and administrators. It provides features for managing users, announcements, thesis topics, grades, and more.

## Features


## Technologies Used
### Frontend
- React.js
- Vite
- TailwindCSS
- React Router DOM

### Backend
- Node.js
- Express.js
- Sequelize ORM
- MySQL

### Other Tools
- Axios
- FontAwesome Icons
- ESLint

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server
- Git

### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd PreThesis-ThesisBoardWeb

2. Install dependencies for the backend:
    ```bash
    cd server
    npm install
3. Install dependencies for the frontend:
    ```bash
    cd ../client
    npm install
4. Configure the database:
    - Create a MySQL database.
    - Update the database configuration in the backend (e.g., server/config/database.js).
5. Run the backend server:
    ```bash
    cd ../server
    npm start
6. Run the frontend development server:
    ```bash
    cd ../client
    npm run dev
7. Open the application in your browser at http://localhost:5173.

### Project Structure
```
PreThesis-ThesisBoardWeb/
├── client/          # Frontend code (React + Vite)
├── server/          # Backend code (Node.js + Express)
├── [README.md]      # Project documentation
```
### Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push the branch.
4. Submit a pull request.

### License
This project is licensed under the MIT License.

### Contact
For any inquiries or support, please contact thientran03.it@gmail.com