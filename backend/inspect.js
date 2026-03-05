const Database=require('better-sqlite3');
const db=new Database('./dev.db');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' and name='User'").get());
console.log(db.prepare('SELECT * FROM User').all());
