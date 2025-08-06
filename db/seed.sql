-- generated sample data using chatGpt for testing purposes
USE webstore_3d;

INSERT INTO location (city, postal_code, country, region) VALUES
('New York', '10001', 'USA', 'New York'),
('Los Angeles', '90210', 'USA', 'California'),
('Chicago', '60601', 'USA', 'Illinois'),
('Houston', '77001', 'USA', 'Texas'),
('Phoenix', '85001', 'USA', 'Arizona'),
('Philadelphia', '19101', 'USA', 'Pennsylvania'),
('San Antonio', '78201', 'USA', 'Texas'),
('San Diego', '92101', 'USA', 'California'),
('Dallas', '75201', 'USA', 'Texas'),
('San Jose', '95101', 'USA', 'California');

INSERT INTO user (username, email, password_hash, first_name, last_name, phone, primary_address, location_id) VALUES
('john_doe', 'john@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', '+1234567890', '123 Main St', 1),
('jane_smith', 'jane@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', '+1987654321', '456 Oak Ave', 2),
('mike_wilson', 'mike@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike', 'Wilson', '+1555666777', '789 Pine Rd', 3),
('sarah_johnson', 'sarah@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Johnson', '+1444555666', '321 Elm St', 4),
('david_brown', 'david@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David', 'Brown', '+1333444555', '654 Maple Ave', 5),
('lisa_davis', 'lisa@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lisa', 'Davis', '+1222333444', '987 Cedar Rd', 6);

INSERT INTO category (category_name, category_description, parent_id) VALUES
('Electronics', 'Electronic devices and gadgets', NULL),
('Smartphones', 'Mobile phones and accessories', 1),
('Laptops', 'Portable computers and notebooks', 1),
('Gaming', 'Gaming consoles and accessories', 1),
('Furniture', 'Home and office furniture', NULL),
('Chairs', 'Various types of chairs', 5),
('Tables', 'Desks and dining tables', 5),
('Sofas', 'Couches and seating furniture', 5),
('Vehicles', 'Cars, motorcycles, and other vehicles', NULL),
('Cars', 'Passenger vehicles', 9),
('Motorcycles', 'Two-wheeled vehicles', 9),
('Fashion', 'Clothing and accessories', NULL),
('Watches', 'Wrist watches and accessories', 12),
('Jewelry', 'Rings, necklaces, and accessories', 12),
('Sports', 'Sports equipment and gear', NULL),
('Fitness', 'Gym and fitness equipment', 15);

INSERT INTO product (title, product_description, price, category_id, seller_id, location_id, condition_type) VALUES
('iPhone 14 Pro Max 256GB', 'Latest iPhone with excellent camera and performance. Barely used, like new condition.', 899.99, 2, 1, 1, 'used'),
('MacBook Pro M2 16inch', 'High-performance laptop for professionals. Includes original charger and box.', 2299.99, 3, 2, 2, 'used'),
('Gaming Laptop ASUS ROG', 'High-performance gaming laptop with RTX 4070 graphics card.', 1299.99, 3, 3, 3, 'new'),
('PlayStation 5 Console', 'Latest gaming console with 2 controllers and 3 games included.', 549.99, 4, 4, 4, 'used'),
('Office Chair Ergonomic', 'Comfortable office chair with lumbar support and adjustable height.', 199.99, 6, 1, 1, 'used'),
('Wooden Dining Table', 'Solid wood dining table for 6 people. Perfect for family dinners.', 449.99, 7, 5, 5, 'used'),
('Gaming Chair RGB', 'Professional gaming chair with RGB lighting and premium materials.', 299.99, 6, 3, 3, 'new'),
('Modern Sofa 3-Seater', 'Comfortable modern sofa in excellent condition. Pet-free home.', 699.99, 8, 6, 6, 'used'),
('BMW X5 2020', 'Luxury SUV in excellent condition. Low mileage, full service history.', 45999.99, 10, 2, 2, 'used'),
('Honda Civic 2019', 'Reliable sedan with excellent fuel economy. Single owner.', 18999.99, 10, 4, 4, 'used'),
('Yamaha R6 2021', 'Sport motorcycle in pristine condition. Low miles, garage kept.', 12999.99, 11, 5, 5, 'used'),
('Rolex Submariner', 'Classic luxury watch with original box and papers.', 8999.99, 13, 6, 6, 'used'),
('Diamond Ring 2ct', 'Beautiful engagement ring with certificate of authenticity.', 5999.99, 14, 1, 1, 'new'),
('Treadmill Commercial Grade', 'Professional treadmill perfect for home gym setup.', 1299.99, 16, 2, 2, 'used'),
('Samsung Galaxy S23 Ultra', 'Latest Samsung flagship with S-Pen. Unlocked for all carriers.', 749.99, 2, 3, 3, 'used'),
('Electric Bike Mountain', 'High-quality electric mountain bike with long battery life.', 1899.99, 15, 4, 4, 'new');

INSERT INTO product_image (product_id, image_url, alt_text, is_primary, sort_order) VALUES
(1, '/uploads/images/iphone14_1.jpg', 'iPhone 14 Pro Max front view', TRUE, 1),
(1, '/uploads/images/iphone14_2.jpg', 'iPhone 14 Pro Max back view', FALSE, 2),
(1, '/uploads/images/iphone14_3.jpg', 'iPhone 14 Pro Max with box', FALSE, 3),
(2, '/uploads/images/macbook_1.jpg', 'MacBook Pro M2 16inch', TRUE, 1),
(2, '/uploads/images/macbook_2.jpg', 'MacBook Pro with accessories', FALSE, 2),
(3, '/uploads/images/asus_rog_1.jpg', 'ASUS ROG Gaming Laptop', TRUE, 1),
(3, '/uploads/images/asus_rog_2.jpg', 'ASUS ROG keyboard detail', FALSE, 2),
(4, '/uploads/images/ps5_1.jpg', 'PlayStation 5 Console', TRUE, 1),
(4, '/uploads/images/ps5_2.jpg', 'PS5 with controllers', FALSE, 2),
(5, '/uploads/images/office_chair_1.jpg', 'Ergonomic Office Chair', TRUE, 1),
(6, '/uploads/images/dining_table_1.jpg', 'Wooden Dining Table', TRUE, 1),
(7, '/uploads/images/gaming_chair_1.jpg', 'Gaming Chair RGB', TRUE, 1),
(8, '/uploads/images/sofa_1.jpg', 'Modern Sofa 3-Seater', TRUE, 1),
(9, '/uploads/images/bmw_x5_1.jpg', 'BMW X5 2020 exterior', TRUE, 1),
(9, '/uploads/images/bmw_x5_2.jpg', 'BMW X5 interior', FALSE, 2),
(10, '/uploads/images/honda_civic_1.jpg', 'Honda Civic 2019', TRUE, 1),
(11, '/uploads/images/yamaha_r6_1.jpg', 'Yamaha R6 2021', TRUE, 1),
(12, '/uploads/images/rolex_1.jpg', 'Rolex Submariner', TRUE, 1),
(13, '/uploads/images/ring_1.jpg', 'Diamond Ring 2ct', TRUE, 1),
(14, '/uploads/images/treadmill_1.jpg', 'Treadmill Commercial Grade', TRUE, 1),
(15, '/uploads/images/samsung_s23_1.jpg', 'Samsung Galaxy S23 Ultra', TRUE, 1),
(16, '/uploads/images/ebike_1.jpg', 'Electric Bike Mountain', TRUE, 1);

INSERT INTO product_3d_model (product_id, model_url, model_type, file_size) VALUES
(1, '/uploads/models/iphone14.glb', 'glb', 2048576),
(2, '/uploads/models/macbook_pro.glb', 'glb', 4194304),
(3, '/uploads/models/asus_laptop.glb', 'glb', 5242880),
(4, '/uploads/models/ps5_console.glb', 'glb', 6291456),
(5, '/uploads/models/office_chair.glb', 'glb', 3145728),
(6, '/uploads/models/dining_table.glb', 'glb', 4194304),
(7, '/uploads/models/gaming_chair.glb', 'glb', 3670016),
(8, '/uploads/models/modern_sofa.glb', 'glb', 7340032),
(9, '/uploads/models/bmw_x5.glb', 'glb', 15728640),
(10, '/uploads/models/honda_civic.glb', 'glb', 12582912),
(11, '/uploads/models/yamaha_r6.glb', 'glb', 8388608),
(12, '/uploads/models/rolex_watch.glb', 'glb', 1572864),
(13, '/uploads/models/diamond_ring.glb', 'glb', 1048576),
(14, '/uploads/models/treadmill.glb', 'glb', 5242880),
(15, '/uploads/models/samsung_s23.glb', 'glb', 2097152),
(16, '/uploads/models/electric_bike.glb', 'glb', 6291456);

INSERT INTO review (product_id, reviewer_id, rating, comment_text, is_verified_purchase) VALUES
(1, 2, 5, 'Great phone, excellent condition as described! Fast shipping.', TRUE),
(1, 3, 4, 'Good phone but battery could be better. Overall satisfied.', FALSE),
(2, 1, 5, 'Amazing laptop performance, highly recommended for professionals!', TRUE),
(3, 4, 5, 'Perfect gaming laptop, runs all games on high settings.', TRUE),
(4, 5, 4, 'Good console, games are fun but controller had minor issue.', TRUE),
(5, 6, 4, 'Comfortable chair, good value for money. Easy assembly.', TRUE),
(6, 1, 5, 'Beautiful table, exactly as described. Very happy with purchase.', TRUE),
(9, 3, 5, 'Excellent car, no issues. Seller was very honest about condition.', TRUE),
(12, 4, 5, 'Authentic Rolex, perfect condition. Great investment piece.', TRUE),
(14, 5, 4, 'Good treadmill for home use. Quiet operation.', TRUE);

INSERT INTO favorite (user_id, product_id) VALUES
(1, 2),
(1, 9),
(1, 12),
(2, 1),
(2, 6),
(2, 14),
(3, 3),
(3, 7),
(3, 11),
(4, 4),
(4, 8),
(4, 16),
(5, 5),
(5, 10),
(5, 13),
(6, 15);

INSERT INTO message (sender_id, receiver_id, product_id, message_subject, message_text) VALUES
(2, 1, 1, 'Question about iPhone', 'Hi, is the iPhone still available? Can you provide more details about the battery health?'),
(1, 2, 1, 'Re: Question about iPhone', 'Yes, still available! Battery health is at 95%. Let me know if you want to see it.'),
(3, 2, 2, 'MacBook inquiry', 'Hello, I am interested in the MacBook. Is the price negotiable?'),
(4, 3, 3, 'Gaming laptop question', 'Does this laptop come with any games installed? Also, how is the cooling system?'),
(5, 4, 4, 'PS5 availability', 'Is the PlayStation still available? Which games are included?'),
(6, 1, 5, 'Office chair dimensions', 'Could you please provide the exact dimensions of the office chair?');

INSERT INTO cart_item (user_id, product_id, quantity) VALUES
(1, 3, 1),
(1, 5, 1),
(2, 1, 1),
(2, 12, 1),
(3, 7, 1),
(3, 16, 1),
(4, 4, 1),
(4, 14, 1),
(5, 6, 1),
(6, 15, 1);

INSERT INTO order_table (buyer_id, total_amount, order_status, shipping_address, payment_method, notes) VALUES
(2, 899.99, 'delivered', '456 Oak Ave, Los Angeles, CA 90210', 'card', 'Please handle with care'),
(3, 199.99, 'shipped', '789 Pine Rd, Chicago, IL 60601', 'paypal', 'Leave at front door if not home'),
(4, 549.99, 'confirmed', '321 Elm St, Houston, TX 77001', 'cash', 'Will pick up in person'),
(5, 449.99, 'pending', '654 Maple Ave, Phoenix, AZ 85001', 'bank_transfer', 'Call before delivery'),
(6, 1299.99, 'delivered', '987 Cedar Rd, Philadelphia, PA 19101', 'card', 'Signature required');

INSERT INTO order_item (order_id, product_id, quantity, price_at_time) VALUES
(1, 1, 1, 899.99),
(2, 5, 1, 199.99),
(3, 4, 1, 549.99),
(4, 6, 1, 449.99),
(5, 14, 1, 1299.99);