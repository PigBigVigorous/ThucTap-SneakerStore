# CƠ SỞ LÝ THUYẾT DỰ ÁN SNEAKER STORE

## 2.5. CƠ SỞ LÝ THUYẾT

### 2.5.1. Công Nghệ Backend: Ngôn Ngữ PHP và Laravel Framework

#### 2.5.1.1. PHP là gì?

PHP (viết tắt đệ quy của PHP: Hypertext Preprocessor) là một ngôn ngữ lập trình kịch bản hay một loại mã lệnh chủ yếu được dùng để phát triển các ứng dụng viết cho máy chủ, mã nguồn mở, dùng cho mục đích tổng quát. Nó rất thích hợp với web và có thể dễ dàng nhúng vào trang HTML. Do được tối ưu hóa cho các ứng dụng web, tốc độ nhanh, nhỏ gọn, cú pháp giống C và Java, dễ học và thời gian xây dựng sản phẩm tương đối ngắn hơn so với các ngôn ngữ khác nên PHP đã nhanh chóng trở thành một ngôn ngữ lập trình web phổ biến nhất thế giới.

Trong dự án Sneaker Store, PHP đóng vai trò là nền tảng phát triển backend server, xử lý các yêu cầu từ phía người dùng, quản lý dữ liệu sản phẩm, đơn hàng, kho hàng và tích hợp các dịch vụ thanh toán như VNPay.

#### 2.5.1.2. Tại sao chọn ngôn ngữ PHP?

Một ưu điểm nổi bật nhất mà ngôn ngữ lập trình PHP thiết lập được đó chính là tính linh hoạt của nó rất cao. Ngôn ngữ lập trình này không hề bị ràng buộc bởi bất kỳ nguyên tắc hay quy luật nào cả, ngoài ra nó còn giúp các lập trình viên được thoải sức, tự do sáng tạo tạo nên những thứ mà họ muốn. Nhờ sự thân thiện như thế với người dùng đồng thời tính linh hoạt cao là điểm mạnh lớn nhất của PHP giúp nó được lựa chọn sử dụng rộng rãi hiện nay.

Người dùng có thể nhanh chóng phát hiện các bản lỗi và báo cho PHP cũng như các sản phẩm từ ngôn ngữ lập trình PHP nhờ có lực lượng cộng đồng hỗ trợ đông đảo, lớn mạnh. Ngoài ra với tính chất mã nguồn mở cũng giúp cho cộng đồng sớm phát hiện và tìm kiếm biện pháp xử lý, khắc phục các lỗi trong mã nguồn PHP để nó hoàn thiện hơn.

Ngôn ngữ lập trình PHP được xem là một trong số những ngôn ngữ lập trình đơn giản, dễ học nhất và đặc biệt là nó rất phù hợp với bất kể ai mới bắt đầu. Kể cả việc bạn không phải là một người lập trình viên cũng đừng quá lo lắng. Bởi không chỉ có những người có chuyên môn IT sẽ được hưởng nhiều lợi ích từ việc học lập trình PHP.

**Các lý do chọn PHP cho dự án Sneaker Store:**
- **Tính ổn định**: PHP đã được sử dụng rộng rãi trong nhiều dự án thương mại điện tử
- **Hiệu năng cao**: Xử lý nhanh các yêu cầu HTTP, phù hợp với ứng dụng web có lượng truy cập lớn
- **Dễ triển khai**: Hỗ trợ tốt trên các hosting phổ biến, không yêu cầu cấu hình phức tạp
- **Tài liệu phong phú**: Có nhiều tài liệu, hướng dẫn và ví dụ trên internet
- **Chi phí thấp**: Hoàn toàn miễn phí, không cần mua giấy phép

#### 2.5.1.3. Lịch sử phát triển PHP

| Phiên Bản | Năm Ra Đời |
|-----------|-----------|
| PHP 1.0 | Ngày 08 tháng 06 năm 1995 |
| PHP 2.0 | Ngày 01 tháng 11 năm 1997 |
| PHP 3.0 | Ngày 06 tháng 06 năm 1998 |
| PHP 4.0 | Ngày 22 tháng 05 năm 2000 |
| PHP 5.0 | Ngày 22 tháng 05 năm 2004 |
| PHP 6.0 | Năm 2006 |
| PHP 7.0 | Ngày 03 tháng 12 năm 2015 |
| PHP 7.4 | Ngày 28 tháng 11 năm 2019 |
| PHP 8.0 | Ngày 26 tháng 11 năm 2020 |

Dự án Sneaker Store sử dụng PHP 8.x trở lên nhằm tận dụng các tính năng hiện đại như union types, match expressions, và attributes.

#### 2.5.1.4. Laravel Framework là gì?

Laravel là một trong những PHP Framework phổ biến nhất trên thế giới được sử dụng để xây dựng ứng dụng web từ các dự án nhỏ đến lớn. Nó tuân theo mô hình MVC (Model-View-Controller) giúp dễ dàng học và nhanh chóng tạo nguyên mẫu cho các ứng dụng web. Với cú pháp đẹp và thanh lịch của Laravel, ta có thể viết code dễ đọc, dễ bảo trì.

Laravel cung cấp một bộ công cụ mạnh mẽ bao gồm:
- **Eloquent ORM**: Cho phép tương tác với cơ sở dữ liệu một cách dễ dàng và tự nhiên
- **Routing**: Định tuyến linh hoạt để xử lý các yêu cầu HTTP
- **Middleware**: Các lớp xử lý trung gian để kiểm tra và xử lý yêu cầu
- **Validation**: Xác thực dữ liệu đầu vào
- **Authentication**: Hệ thống xác thực và phân quyền (sanctum)
- **Database Migrations**: Quản lý cấu trúc cơ sở dữ liệu

#### 2.5.1.5. Tại sao chọn Laravel Framework?

Framework cung cấp các quy ước làm giảm số lượng mã nguồn mà nhà phát triển mới cho dự án phải hiểu – ví dụ, nếu bạn hiểu cách định tuyến hoạt động trong một dự án Laravel, bạn hiểu cách nó hoạt động trong tất cả các dự án khác được xây dựng trên Laravel.

Các framework không chỉ cung cấp cho bạn một nền tảng vững chắc mà còn cho bạn tự do tùy chỉnh nội dung. Và điều này, Laravel làm rất tốt, đó là một trong các lý do làm cho Laravel trở nên đặc biệt.

**Các ưu điểm của Laravel cho dự án Sneaker Store:**
- **MVC Architecture**: Phân tách rõ ràng Model, View, Controller giúp code dễ bảo trì
- **Eloquent ORM**: Làm việc với dữ liệu sản phẩm, đơn hàng, kho hàng một cách tự nhiên
- **API Development**: Hỗ trợ xây dựng RESTful API cho ứng dụng frontend
- **Security**: Hỗ trợ CSRF, SQL Injection prevention, password hashing
- **Database Seeding**: Dễ dàng tạo dữ liệu test
- **Task Scheduling**: Xử lý các công việc định kỳ như báo cáo doanh thu, bảo trì kho hàng
- **Rich Ecosystem**: Hỗ trợ thêm qua các package như Sanctum (authentication), Queue (xử lý công việc bất đồng bộ)

#### 2.5.1.6. Lịch sử phát triển Laravel

Phiên bản đầu tiên của Laravel được Taylor Otwell tạo ra vào tháng 6 năm 2011 như một giải pháp thay thế cho CodeIgniter. Với framework này, lập trình viên được hỗ trợ nhiều tính năng mới mẻ, hiệu quả và dễ thực hiện hơn. Cho đến nay, Laravel đã được phát triển đến phiên bản 11.x với nhiều cải tiến mới mẻ hơn.

Các phiên bản chính:
- **Laravel 5.1 (2015)** - LTS version, được hỗ trợ lâu dài
- **Laravel 6.0 (2019)** - Cải thiện semantic versioning
- **Laravel 8.0 (2020)** - Thêm Models directory, Factory, Seeder improvements
- **Laravel 10.0 (2023)** - LTS version mới nhất, cải thiện Cluster routing
- **Laravel 11.x (2024)** - Phiên bản hiện tại với các tính năng mới

Dự án Sneaker Store sử dụng Laravel 11.x để tận dụng các tính năng mới nhất và hỗ trợ kỹ thuật.

---

### 2.5.2. Công Nghệ Frontend: Next.js và React

#### 2.5.2.1. React là gì?

React là một thư viện JavaScript được phát triển bởi Meta (Facebook) dùng để xây dựng giao diện người dùng (UI) với các component có thể tái sử dụng. React sử dụng Virtual DOM để tối ưu hóa hiệu năng khi cập nhật giao diện, cho phép xây dựng các ứng dụng web tương tác mà không cần làm mới trang.

Trong dự án Sneaker Store, React được sử dụng để tạo các component giao diện như:
- **Danh sách sản phẩm** (Product listing)
- **Chi tiết sản phẩm** (Product details)
- **Giỏ hàng** (Shopping cart)
- **Trang thanh toán** (Checkout)
- **Dashboard quản lý** (Admin dashboard)
- **Quản lý kho hàng** (Inventory management)

#### 2.5.2.2. Next.js Framework là gì?

Next.js là một framework React được xây dựng trên nền React, cung cấp các tính năng bổ sung như:
- **Server-Side Rendering (SSR)**: Render trang trên server để SEO tốt hơn
- **Static Site Generation (SSG)**: Tạo các trang tĩnh trước thời gian xây dựng
- **Incremental Static Regeneration (ISR)**: Cập nhật các trang tĩnh mà không cần rebuild toàn bộ
- **API Routes**: Xây dựng API backend ngay trong Next.js
- **File-based Routing**: Routing tự động dựa trên cấu trúc thư mục
- **Image Optimization**: Tối ưu hóa hình ảnh tự động
- **TypeScript Support**: Hỗ trợ bậc nhất cho TypeScript

#### 2.5.2.3. Tại sao chọn Next.js cho Sneaker Store?

**Các lý do chọn Next.js:**
- **SEO Friendly**: SSR giúp các sản phẩm được tìm kiếm tốt trên Google
- **Performance**: Tối ưu hóa tự động, code splitting, lazy loading
- **Developer Experience**: File-based routing, hot reloading, excellent debugging
- **Type Safety**: TypeScript support giúp phát hiện lỗi sớm
- **Deployment**: Dễ dàng triển khai trên các nền tảng như Vercel, Netlify
- **Full-Stack**: Có thể xây dựng cả frontend lẫn backend API
- **Component Reusability**: Tái sử dụng component dễ dàng giữa các trang

Dự án Sneaker Store sử dụng Next.js để:
- Hiển thị danh sách sản phẩm với SEO tốt
- Tạo trang chi tiết sản phẩm động
- Quản lý khách hàng với authentication
- Xây dựng admin dashboard
- Tích hợp với VNPay payment gateway

---

### 2.5.3. Bootstrap và Tailwind CSS - Công Nghệ Frontend Styling

#### 2.5.3.1. Bootstrap là gì?

Bootstrap cho phép quá trình thiết kế website diễn ra nhanh chóng và dễ dàng hơn dựa trên những thành tố cơ bản sẵn có như typography, forms, buttons, tables, grids, navigation, image carousels...

Bootstrap là một bộ sưu tập miễn phí của các mã nguồn mở và công cụ dùng để tạo ra một mẫu website hoàn chỉnh. Với các thuộc tính về giao diện được quy định sẵn như kích thước, màu sắc, độ cao, độ rộng..., các designer có thể sáng tạo nhiều sản phẩm mới mẻ nhưng vẫn tiết kiệm thời gian khi làm việc với framework này trong quá trình thiết kế giao diện website.

#### 2.5.3.2. Tại sao lại chọn Bootstrap / Tailwind CSS?

**Các ưu điểm:**
- **Dễ dàng thao tác**: Các class CSS được xây dựng sẵn, không cần viết CSS từ đầu
- **Tùy chỉnh dễ dàng**: Có thể tùy chỉnh màu sắc, kích thước, font chữ
- **Chất lượng sản phẩm đầu ra hoàn hảo**: Responsive design, tương thích với các trình duyệt
- **Độ tương thích cao**: Hoạt động trên mọi thiết bị từ mobile đến desktop
- **Cộng đồng lớn**: Có nhiều plugin, extension, template có sẵn
- **Tốc độ phát triển nhanh**: Giảm thời gian làm việc với giao diện

Dự án Sneaker Store sử dụng PostCSS và các công cụ CSS modernization để tạo giao diện responsive và đẹp mắt.

---

### 2.5.4. Hệ Quản Trị Cơ Sở Dữ Liệu MySQL

#### 2.5.4.1. MySQL là gì?

MySQL là hệ quản trị cơ sở dữ liệu tự do nguồn mở phổ biến nhất thế giới và được các nhà phát triển rất ưa chuộng trong quá trình phát triển ứng dụng. Vì MySQL là hệ quản trị cơ sở dữ liệu tốc độ cao, ổn định và dễ sử dụng, có tính khả chuyển, hoạt động trên nhiều hệ điều hành cung cấp một hệ thống lớn các hàm tiện ích rất mạnh. Với tốc độ và tính bảo mật cao, MySQL rất thích hợp cho các ứng dụng có truy cập CSDL trên internet.

Người dùng có thể tải về MySQL miễn phí từ trang chủ. MySQL có nhiều phiên bản cho các hệ điều hành khác nhau: phiên bản Win32 cho các hệ điều hành dòng Windows, Linux, Mac OS X, Unix, FreeBSD, NetBSD, Novell NetWare, SGI Irix, Solaris, SunOS,...

#### 2.5.4.2. Tại sao chọn MySQL?

**Sử dụng dễ dàng**: MySQL là cơ sở dữ liệu tốc độ cao và ổn định, công cụ này dễ sử dụng và hoạt động trên nhiều hệ điều hành cung cấp hệ thống lớn các hàm tiện ích.

**Tính bảo mật cao**: MySQL phù hợp với các ứng dụng có truy cập cơ sở dữ liệu trên internet vì nó sở hữu nhiều tính năng bảo mật, thậm chí là bảo mật cấp cao. Nó hỗ trợ:
- User privileges system
- Password encryption
- Host verification
- User permission checking

**Đa tính năng**: MySQL có thể hỗ trợ hàng loạt các chức năng SQL từ hệ quản trị cơ sở dữ liệu quan hệ trực tiếp và cả gián tiếp. Nó hỗ trợ:
- ACID transactions (với InnoDB engine)
- Foreign keys
- Triggers
- Views
- Stored procedures

**Khả năng mở rộng và mạnh mẽ**: Công cụ MySQL có khả năng xử lý khối dữ liệu lớn và có thể mở rộng khi cần thiết. Có thể:
- Làm việc với bảng lớn (hàng triệu records)
- Xử lý nhiều kết nối đồng thời
- Tối ưu hóa query với indexes

**Tương thích trên nhiều hệ điều hành**: MySQL tương thích để chạy trên nhiều hệ điều hành, như Novell NetWare, Windows, Linux, nhiều loại UNIX (như Sun Solaris, AIX và DEC UNIX), OS/2, FreeBSD,...

MySQL cũng cung cấp phương tiện mà các máy khách có thể chạy trên cùng một máy tính với máy chủ hoặc trên một máy tính khác (giao tiếp qua mạng cục bộ hoặc Internet).

**Cho phép khôi phục**: MySQL cho phép các transaction được khôi phục, cam kết và phục hồi sự cố.

#### 2.5.4.3. Cấu trúc Cơ Sở Dữ Liệu Sneaker Store

Dự án Sneaker Store sử dụng MySQL để quản lý:

**Quản lý sản phẩm:**
- `products`: Thông tin sản phẩm giới hạn chung
- `product_variants`: Các biến thể sản phẩm (kích thước, màu sắc)
- `product_images`: Hình ảnh sản phẩm
- `brands`: Các hãng giày
- `categories`: Danh mục sản phẩm
- `colors`: Các màu sắc
- `sizes`: Các kích thước giày

**Quản lý kho hàng:**
- `variant_branch_stocks`: Tồn kho theo chi nhánh
- `inventory_transactions`: Lịch sử giao dịch kho

**Quản lý đơn hàng:**
- `orders`: Đơn hàng chính
- `order_items`: Chi tiết các mặt hàng trong đơn hàng

**Quản lý người dùng:**
- `users`: Thông tin người dùng
- `product_reviews`: Đánh giá sản phẩm

**Quản lý cấu hình:**
- `discounts`: Mã giảm giá
- `suppliers`: Nhà cung cấp
- `purchase_orders`: Đơn mua hàng từ nhà cung cấp

---

### 2.5.5. Giới thiệu về UML (Unified Modeling Language)

#### 2.5.5.1. UML là gì?

UML (Unified Modeling Language) là ngôn ngữ dành cho việc đặc tả, hình dung, xây dựng và làm tài liệu của các hệ thống phần mềm.

UML tạo cơ hội để viết thiết kế hệ thống, bao gồm những khái niệm như tiến trình nghiệp vụ và các chức năng của hệ thống.

Cụ thể, nó hữu dụng cho những ngôn ngữ khai báo, giản đồ cơ sở dữ liệu, thành phần phần mềm có khả năng tái sử dụng.

UML được phát triển bởi Rational Rose và một số nhóm cộng tác, nó nhanh chóng trở thành một trong những ngôn ngữ chuẩn để xây dựng hệ thống phần mềm hướng đối tượng (Object-Oriented).

Đây là ngôn ngữ kế vị xứng đáng cho những ngôn ngữ mô hình hóa như Booch, OOSE/Jacobson, OMT và một số các phương thức khác.

#### 2.5.5.2. Các loại sơ đồ UML trong Sneaker Store

**Use Case Diagram**: Mô tả các tương tác giữa người dùng (actor) và hệ thống
- Khách hàng: Duyệt sản phẩm, thêm vào giỏ hàng, đặt hàng, thanh toán
- Quản lý viên: Quản lý sản phẩm, đơn hàng, kho hàng, người dùng
- Nhân viên bán hàng: Xử lý đơn hàng, quản lý POS

**Class Diagram**: Mô tả cấu trúc các class và mối quan hệ giữa chúng
- Thực thể như User, Product, Order, OrderItem, Discount
- Mối quan hệ: Association, Inheritance, Composition

**Sequence Diagram**: Mô tả trình tự tương tác giữa các thành phần
- Quy trình đặt hàng: Khách hàng → Frontend → Backend API → Database
- Quy trình thanh toán VNPay: Frontend → Backend → VNPay → Backend → Frontend

**Activity Diagram**: Mô tả các hoạt động và luồng xử lý
- Quy trình xử lý đơn hàng
- Quy trình kiểm tra kho hàng
- Quy trình khôi phục lỗi

**Deployment Diagram**: Mô tả kiến trúc triển khai hệ thống
- Frontend Node deployed on web server
- Backend PHP deployed on application server
- MySQL database on database server

#### 2.5.5.3. Ứng dụng UML trong dự án Sneaker Store

UML giúp:
- **Thiết kế rõ ràng**: Mô hình hóa rõ ràng các yêu cầu trước khi code
- **Giao tiếp**: Dễ dàng giao tiếp giữa các thành viên trong nhóm
- **Tài liệu hóa**: Tạo tài liệu hóa chi tiết cho dự án
- **Bảo trì**: Dễ dàng bảo trì và mở rộng hệ thống về sau
- **Phát hiện lỗi sớm**: Phát hiện các vấn đề thiết kế trước khi code

---

### 2.5.6. Mô Hình Kiến Trúc: Model-View-Controller (MVC)

#### 2.5.6.1. MVC là gì?

MVC (Model-View-Controller) là một mô hình kiến trúc phần mềm phân chia ứng dụng thành ba phần:

1. **Model**: Quản lý dữ liệu và logic nghiệp vụ
   - Tương tác với cơ sở dữ liệu
   - Xác thực dữ liệu
   - Thực hiện các quy tắc kinh doanh

2. **View**: Hiển thị dữ liệu cho người dùng
   - Giao diện người dùng (UI)
   - Không xử lý logic
   - Chỉ nhận dữ liệu từ Controller để hiển thị

3. **Controller**: Xử lý yêu cầu từ người dùng
   - Tiếp nhận input từ View
   - Gọi Model để xử lý dữ liệu
   - Chuyển kết quả tới View

#### 2.5.6.2. Lợi ích của MVC

- **Phân tách mối lo ngại**: Mỗi phần có trách nhiệm rõ ràng
- **Tái sử dụng code**: Model có thể dùng cho nhiều View khác nhau
- **Dễ bảo trì**: Thay đổi một phần không ảnh hưởng phần khác
- **Dễ test**: Có thể test từng phần độc lập
- **Skalability**: Dễ dàng mở rộng chức năng

#### 2.5.6.3. MVC trong Sneaker Store

**Backend (Laravel)**:
- **Model**: Eloquent models (User, Product, Order, etc.)
- **Controller**: Http\Controllers (ProductController, OrderController, etc.)
- **View**: API responses (JSON) hoặc views (Blade templates)

**Frontend (Next.js)**:
- **Model**: Store (zustand), Context API, API services
- **View**: React components
- **Controller**: Page components, Route handlers

---

### 2.5.7. API RESTful

#### 2.5.7.1. REST là gì?

REST (Representational State Transfer) là một kiến trúc cho phép tăng cường các web services bằng cách sử dụng các đặc điểm và phương thức của giao thức HTTP.

#### 2.5.7.2. RESTful API trong Sneaker Store

Dự án sử dụng RESTful API để giao tiếp giữa frontend (Next.js) và backend (Laravel):

**Ví dụ endpoints:**
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/{id}` - Lấy chi tiết sản phẩm
- `POST /api/orders` - Tạo đơn hàng mới
- `GET /api/orders/{id}` - Lấy chi tiết đơn hàng
- `POST /api/auth/login` - Đăng nhập
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/checkout` - Thanh toán

---

## Kết Luận

Dự án Sneaker Store được xây dựng dựa trên các công nghệ hiện đại và được chứng minh hiệu quả:

- **Backend**: Laravel + PHP cho server-side logic mạnh mẽ và bảo mật
- **Frontend**: Next.js + React + TypeScript cho giao diện tương tác và SEO tốt
- **Database**: MySQL cho lưu trữ dữ liệu ổn định
- **Architecture**: MVC + RESTful API cho cấu trúc rõ ràng và dễ bảo trì
- **Design**: UML cho mô hình hóa và thiết kế rõ ràng

Sự kết hợp này tạo ra một ứng dụng thương mại điện tử chuyên nghiệp, có khả năng mở rộng và bảo trì dễ dàng.
