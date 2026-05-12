import fs from 'fs';

const create = (path, name) => {
  fs.writeFileSync(path, `import React from 'react';

const ${name} = () => {
  return <div className="p-8 text-center text-xl">หน้า ${name} (กำลังพัฒนา)</div>;
};

export default ${name};
`);
};

create('src/pages/admin/AdminDashboard.jsx', 'AdminDashboard');
create('src/pages/admin/AdminFields.jsx', 'AdminFields');
create('src/pages/admin/AdminBalls.jsx', 'AdminBalls');
create('src/pages/admin/AdminBookings.jsx', 'AdminBookings');
create('src/pages/admin/AdminUsers.jsx', 'AdminUsers');
create('src/pages/user/Fields.jsx', 'Fields');
create('src/pages/user/Balls.jsx', 'Balls');
create('src/pages/user/History.jsx', 'History');
