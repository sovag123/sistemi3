-- schema for the database, used when new instance of the project is created.
CREATE DATABASE IF NOT EXISTS webstore_3d;
USE webstore_3d;

CREATE TABLE location (
    id INT PRIMARY KEY AUTO_INCREMENT,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    primary_address TEXT,
    location_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES location(id) ON DELETE SET NULL
);

CREATE TABLE category (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL,
    category_description TEXT,
    parent_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES category(id) ON DELETE SET NULL
);

CREATE TABLE product (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    product_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INT NOT NULL,
    seller_id INT NOT NULL,
    location_id INT,
    condition_type ENUM('new', 'used', 'refurbished') DEFAULT 'used',
    is_active BOOLEAN DEFAULT TRUE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES location(id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_seller (seller_id),
    INDEX idx_location (location_id),
    INDEX idx_price (price),
    INDEX idx_created (created_at)
);

CREATE TABLE product_image (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);

CREATE TABLE product_3d_model (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    model_url VARCHAR(500) NOT NULL,
    model_type ENUM('glb', 'gltf', 'obj', 'fbx') NOT NULL,
    file_size INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);

CREATE TABLE order_table (
    id INT PRIMARY KEY AUTO_INCREMENT,
    buyer_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    payment_method ENUM('cash', 'card', 'paypal', 'bank_transfer') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_buyer (buyer_id),
    INDEX idx_status (order_status)
);

CREATE TABLE order_item (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_time DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES order_table(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE RESTRICT,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
);

CREATE TABLE review (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (product_id, reviewer_id),
    INDEX idx_product (product_id),
    INDEX idx_reviewer (reviewer_id)
);

CREATE TABLE favorite (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, product_id),
    INDEX idx_user (user_id)
);

CREATE TABLE message (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    product_id INT NULL,
    message_subject VARCHAR(200),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE SET NULL,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_product (product_id)
);

CREATE TABLE cart_item (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id),
    INDEX idx_user (user_id)
);
DROP TABLE IF EXISTS review;

CREATE TABLE product_comment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_comment_id INT NULL,
    comment_text TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES product_comment(id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_user (user_id),
    INDEX idx_parent (parent_comment_id),
    INDEX idx_created (created_at)
);
USE webstore_3d;

-- Add session management table
CREATE TABLE user_session (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_token (session_token),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at),
    INDEX idx_active (is_active)
);

-- Add login attempts tracking table
CREATE TABLE login_attempt (
    id INT PRIMARY KEY AUTO_INCREMENT,
    identifier VARCHAR(255) NOT NULL, -- email, username, or IP
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    INDEX idx_identifier (identifier),
    INDEX idx_ip (ip_address),
    INDEX idx_time (attempt_time)
);

-- Add account lock table
CREATE TABLE account_lock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    identifier VARCHAR(255), -- for non-existing users
    ip_address VARCHAR(45) NOT NULL,
    locked_until TIMESTAMP NOT NULL,
    reason ENUM('failed_attempts', 'suspicious_activity', 'manual') DEFAULT 'failed_attempts',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_identifier (identifier),
    INDEX idx_ip (ip_address),
    INDEX idx_locked_until (locked_until)
);

-- Add columns to user table for enhanced security
ALTER TABLE user ADD COLUMN last_login TIMESTAMP NULL;
ALTER TABLE user ADD COLUMN failed_login_attempts INT DEFAULT 0;
ALTER TABLE user ADD COLUMN last_failed_login TIMESTAMP NULL;
ALTER TABLE user ADD COLUMN account_locked_until TIMESTAMP NULL;
ALTER TABLE user ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE user ADD COLUMN deleted_at TIMESTAMP NULL;