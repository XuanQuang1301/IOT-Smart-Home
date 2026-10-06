// GET /api/v1/user/profile
async function getUserProfile(req, res) {
  try {
    return res.json({
      status: 'success',
      data: {
        id: 1,
        full_name: 'Đặng Xuân Quang',
        student_id: 'B23DCCN686',
        class_name: 'D23CNPM06',
        major: 'Công nghệ phần mềm',
        email: 'quangdx.b23cn686@stu.ptit.edu.vn',
        avatar_url: 'https://ui-avatars.com/api/?name=Dang+Xuan+Quang&background=3b82f6&color=fff&size=128',
        links: {
          github: 'https://github.com/XuanQuang1301/IOT-Smart-Home',
          figma: 'https://www.figma.com/design/bp3cfY9WkXlfF5lN4PreqN/Untitled?node-id=0-1&t=FEGKawTyiA9gA240-1',
          postman: 'https://postman.com',
          report: 'https://drive.google.com/file/d/13nv0bGtUUwD4Xyn19TzxqBvjHtVGuRMv/view?usp=sharing'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ status: 'error', message: 'Không thể lấy thông tin người dùng' });
  }
}

// PUT /api/v1/user/profile
async function updateUserProfile(req, res) {
  try {
    return res.json({
      status: 'success',
      message: 'Cập nhật thông tin hồ sơ thành công',
      data: {
        ...req.body,
        id: 1
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ status: 'error', message: 'Không thể cập nhật hồ sơ người dùng' });
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile
};
