import express from "express";
import mysql from "mysql";
import cors from "cors";
import bodyparser from "body-parser";
import jwt from "jsonwebtoken";
import cookieparser from "cookie-parser";
import axios from "axios";
import crypto from "crypto";
import config from './config.js';


const app = express();

app.use(cookieparser());
app.use(express.json());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET"],
    credentials: true
}));

// Kết nối MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'store'
});

// Kết nối cơ sở dữ liệu
db.connect((err) => {
    if (err) {
        console.error("Lỗi kết nối cơ sở dữ liệu:", err);
    } else {
        console.log("Kết nối cơ sở dữ liệu thành công!");
    }
});

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ Message: "Bạn đã sai" });
    }
    else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if (err) {
                return res.json({ Message: "Bạn đã sai" })
            }
            else {
                req.name = decoded.name;
                req.makh = decoded.makh;
                next();
            }
        })
    }
}
const verifyAdmin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ Message: "Bạn đã sai" });
    }
    else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if (err) {
                return res.json({ Message: "Bạn đã sai" })
            }
            else {
                req.name = decoded.name;
                req.manv = decoded.manv;
                next();
            }
        })
    }
}
app.get('/auth', verifyUser, (req, res) => {
    return res.json({ Status: "Success", name: req.name, makh: req.makh });
})
app.get('/authad', verifyAdmin, (req, res) => {
    return res.json({ Status: "Success", name: req.name, manv: req.manv });
})
app.get('/logout', function (req, res) {
    res.clearCookie('token');
    return res.json({ Status: "Success" });
})


//login
app.post('/login', (req, res) => {
    db.connect((err) => {

        const sql = 'SELECT * FROM user WHERE email = ? AND matkhau = ?';
        db.query(sql, [req.body.email, req.body.matkhau], (err, data) => {
            if (err) {
                return res.json('Tài khoản hoặc mật khẩu đã sai');
            }
            if (data.length > 0) {
                const name = data[0].tenkh;
                const makh = data[0].makh;
                console.log(name);
                const token = jwt.sign({ name, makh }, "jwt-secret-key", { expiresIn: '1d' });
                res.cookie('token', token);
                return res.json({ Status: "Success" });
            } else {
                return res.json({ Status: "not Success" });
            }
        });
    });
});
//end login 
//login
app.post('/loginad', (req, res) => {
    db.connect((err) => {

        const sql = 'SELECT * FROM nhanvien WHERE email = ? AND matkhau = ?';
        db.query(sql, [req.body.email, req.body.matkhau], (err, data) => {
            if (err) {
                return res.json('Tài khoản hoặc mật khẩu đã sai');
            }
            if (data.length > 0) {
                const name = data[0].tennv;
                const manv = data[0].manv;
                console.log(name);
                const token = jwt.sign({ name, manv }, "jwt-secret-key", { expiresIn: '1d' });
                res.cookie('token', token);
                return res.json({ Status: "Success" });
            } else {
                return res.json({ Status: "not Success" });
            }
        });
    });
});
//end login 

// Code resigter
app.post("/resigter", (req, res) => {
    db.connect((err) => {
        const values = [
            req.body.name,
            req.body.email,
            req.body.phone,
            req.body.password
        ]
        const sql = "INSERT INTO user (tenkh,email,phone,matkhau) values(?)"
        db.query(sql, [values], (err, data) => {
            if (err) {
                return res.json({ Status: "Registration failed" })
            }
            else {
                return res.json(data)
            }
        })
    })
})


// end resigter
// danh muc sp
app.get('/loaisp', (req, res) => {
    db.connect((err) => {
        const sql = "SELECT* FROM loaisp"
        db.query(sql, (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
// end danh muc sp
// product
app.get("/product", (req, res) => {
    db.connect((err) => {
        const sql = "SELECT * FROM sanpham"
        db.query(sql, (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
// end product
// chitietsp
app.get("/product/:id", (req, res) => {
    db.connect((err) => {
        const sql = "SELECT *FROM sanpham where masp=?"
        db.query(sql, [req.params.id], (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })

})
//end chitiet
// capnhatsoluong
app.post("/updatesoluong/:masp/:masize", (req, res) => {
    db.connect((err) => {
        const sql = "Update soluong set soluong=? where masp=? and masize=?"
        db.query(sql, [req.body.soluong, req.params.masp, req.params.masize], (err, data) => {
            if (err) {
                return res.json("Error")
            }
            else {
                console.log();
                return res.json(data);
            }
        })
    })
})
//end capnhatsoluong

//size 
app.get("/sizegiay/:id", (req, res) => {
    db.connect((err) => {
        const params = req.params.id
        const sql = "SELECT sizegiay.masize,sizegiay.sosize from sanpham join soluong on sanpham.masp=soluong.masp join sizegiay on soluong.masize=sizegiay.masize where sanpham.masp=?"
        db.query(sql, [params], (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
// end size
app.get("/qlp", (req, res) => {
    db.connect((err) => {
        const sql = "SELECT *FROM sanpham join soluong on soluong.masp=sanpham.masp join sizegiay on soluong.masize=sizegiay.masize"
        db.query(sql, (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
//delete
app.get("/deletep/:id", (req, res) => {
    const { id } = req.params;

    const deleteSoluongSql = `
        DELETE FROM soluong WHERE masp = ?;
    `;
    const deleteSanphamSql = `
        DELETE FROM sanpham WHERE masp = ?;
    `;

    db.beginTransaction((err) => {
        if (err) {
            return res.json({ message: "Lỗi khởi tạo giao dịch", error: err });
        }

        db.query(deleteSoluongSql, [id], (err) => {
            if (err) {
                return db.rollback(() => res.json({ message: "Lỗi khi xóa trong bảng soluong", error: err }));
            }

            db.query(deleteSanphamSql, [id], (err, result) => {
                if (err) {
                    return db.rollback(() => res.json({ message: "Lỗi khi xóa sản phẩm", error: err }));
                }

                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => res.json({ message: "Lỗi khi commit giao dịch", error: err }));
                    }
                    return res.json({ message: "Xóa sản phẩm thành công", data: result });
                });
            });
        });
    });
});

//end delete

//create p
app.post("/createp", (req, res) => {
    db.connect((err) => {
        const sql = "INSERT INTO  sanpham (`masp`,`tensp`,`gia`,`hinh`,`mota`,`maloai`) VALUES(?)";
        const values = [
            req.body.masp,
            req.body.tensp,
            req.body.gia,
            req.body.hinh,
            req.body.mota,
            req.body.maloai,

        ]
        db.query(sql, [values], (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
// end create p
//sreach
app.post("/sreach/:ten", (req, res) => {
    db.connect((err) => {

        const sql = `SELECT *FROM sanpham where tensp LIKE '%${req.params.ten}%'`;
        db.query(sql, (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
// end sreach
// updatep
app.post('/updatep/:id', (req, res) => {
    db.connect((err) => {

        const sql = `UPDATE sanpham set tensp=?, gia=?, hinh=?, mota=?, maloaisp=? where masp=?`
        db.query(sql, [req.body.tensp,
        req.body.gia,
        req.body.hinh,
        req.body.mota,
        req.body.maloaisp,
        req.params.id], (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })

})
// end updatep

// Thêm hóa đơn
app.post("/addhoadon", (req, res) => {
    const {
        tongsoluong,
        tongtien,
        ngaylaphoadon,
        mathanhtoan,
        phuongthucthanhtoan,
        trangthai,
        manv,
        makh
    } = req.body;

    const sqlString = `
      INSERT INTO hoadon (tongsoluong, tongtien, ngaylaphoadon, mathanhtoan, phuongthucthanhtoan, trangthai, manv, makh) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        sqlString,
        [
            tongsoluong,
            tongtien,
            ngaylaphoadon,
            mathanhtoan,
            phuongthucthanhtoan,
            trangthai,
            manv,
            makh
        ],
        (err, result) => {
            if (err) {
                console.error(err);
                res.json({ status: "error", message: "Thêm hóa đơn thất bại" });
            } else {
                res.json({ status: "success", data: result });
            }
        }
    );
});

// Lấy danh sách hóa đơn
app.get("/hoadon", (req, res) => {
    const sqlString = "SELECT * FROM hoadon";
    db.query(sqlString, (err, result) => {
        if (err) {
            console.error(err);
            res.json({ status: "error", message: "Lấy danh sách hóa đơn thất bại" });
        } else {
            res.json({ status: "success", data: result });
        }
    });
});

// Xóa hóa đơn
app.get("/deletehoadon/:id", (req, res) => {
    const { id } = req.params;
    const sqlString = "DELETE FROM hoadon WHERE mahd = ?";
    db.query(sqlString, [id], (err, result) => {
        if (err) {
            console.error(err);
            res.json({ status: "error", message: "Xóa hóa đơn thất bại" });
        } else {
            res.json({ status: "success", data: result });
        }
    });
});

// Cập nhật hóa đơn
app.post("/updatehoadon/:id", (req, res) => {
    const { id } = req.params;
    const { trangthai, manv } = req.body;

    const sqlString = `UPDATE hoadon SET trangthai = ?, manv = ? WHERE mahd = ?`;
    db.query(sqlString, [trangthai, manv, id], (err, result) => {
        if (err) {
            console.error(err);
            res.json({ status: "error", message: "Cập nhật hóa đơn thất bại" });
        } else {
            res.json({ status: "success", data: result });
        }
    });
});
// qlu
app.get("/qlu", (req, res) => {
    db.connect((err) => {
        const sql = `SELECT * from user`
        db.query(sql, (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
//end qlu
// create u 
app.post("/createu", (req, res) => {
    db.connect((err) => {
        const sql = "INSERT INTO user(`tenkh`,`email`,`phone`,`diachi`,`matkhau`)VALUES(?)"
        const values = [
            req.body.tenkh,
            req.body.email,
            req.body.phone,
            req.body.diachi,
            req.body.matkhau
        ]
        db.query(sql, [values], (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
// end create u
// delete u
app.get("/deleteu/:id", (req, res) => {
    db.connect((err) => {
        const sql = "DELETE  from user where makh=?"
        db.query(sql, [req.params.id], (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
// end delete u
//update  u
app.post('/updateu/:id', (req, res) => {
    db.connect((err) => {
        const sql = "UPDATE user set tenkh=?,email=?,phone=?,diachi=?,matkhau=? where makh=?"
        db.query(sql, [req.body.tenkh,
        req.body.email,
        req.body.phone,
        req.body.diachi,
        req.body.matkhau,
        req.params.id
        ], (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
// end  u
// cart
app.post('/addCart', (req, res) => {
    db.connect(() => {
        const values = [
            req.body.masp,
            req.body.makh,
            req.body.tensp,
            req.body.gia,
            req.body.soluong,
            req.body.size,
            new Date(), // Lấy ngày hiện tại cho cột ngaylap

        ];

        const sql = `
            INSERT INTO giohang (masp, makh, tensp, gia, soluong, size, ngaylapgiohang) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, values, (err, data) => {
            if (err) {
                console.error("Error adding product to cart:", err);
                return res.json(err);
            } else {
                return res.json(data);
            }
        });
    });
});
//end cart
// get cart
app.get('/getcart', (req, res) => {
    db.connect(() => {
        const sql = `
            SELECT giohang.*, sizegiay.sosize 
            FROM giohang 
            JOIN sizegiay ON sizegiay.masize = giohang.size
            WHERE giohang.mahd IS NULL
        `;

        db.query(sql, (err, data) => {
            if (err) {
                console.error("Error fetching cart data:", err);
                return res.json(err);
            } else {
                return res.json(data);
            }
        });
    });
});
app.get('/showshowcart/:id', (req, res) => {
    db.connect(() => {
        const sql = "SELECT* FROM giohang join sizegiay on sizegiay.masize = giohang.size where makh=? and mahd is null "
        db.query(sql, [req.params.id], (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })

    })
})
//end get 
// update so lượng
app.post('/updatesl', (req, res) => {
    db.connect(() => {
        const sql = "UPDATE giohang set soluong=? where masp=? AND size=?"
        db.query(sql, [req.body.soluong, req.body.masp, req.body.masize], (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
//end update so luong
//update trang thái
app.post("/updatetrangthai/:masp/:size", (req, res) => {
    const sqlString = "UPDATE giohang SET trangthai = ? WHERE masp = ? AND size = ?";
    db.query(
        sqlString,
        [req.body.trangthai, req.params.masp, req.params.size],
        (err, data) => {
            if (err) {
                console.error("Error updating product status:", err);
                return res.status(500).json({ error: "Error updating product status" });
            } else {
                return res.json({ success: true, message: "Product status updated successfully", data });
            }
        }
    );
});

// end update trang thai

// ad hoa don
app.post("/addhoadon", (req, res) => {
    const {
        tongsoluong,
        tongtien,
        ngaylaphoadon,
        mathanhtoan,
        phuongthucthanhtoan,
        trangthai,
        manv,
        makh,
    } = req.body;

    console.log("Giá trị mathanhtoan nhận được:", mathanhtoan); // Log giá trị để kiểm tra

    if (!mathanhtoan) {
        return res.status(400).json({ message: "mathanhtoan không hợp lệ!" });
    }

    const sql = `
        INSERT INTO hoadon (
            tongsoluong,
            tongtien,
            ngaylaphoadon,
            mathanhtoan,
            phuongthucthanhtoan,
            trangthai,
            manv,
            makh
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [tongsoluong, tongtien, ngaylaphoadon, mathanhtoan, phuongthucthanhtoan, trangthai, manv, makh],
        (err, result) => {
            if (err) {
                console.error("Lỗi khi thêm hóa đơn:", err);
                return res.status(500).json({ message: "Thêm hóa đơn thất bại" });
            }
            return res.status(200).json({ message: "Thêm hóa đơn thành công", data: result });
        }
    );
});

// end add hoa dondon
// delete gio hàng
app.get('/deletecart/:masp/:size', (req, res) => {
    db.connect((err) => {
        const masp = req.params.masp;
        const size = req.params.size;

        const sql = "DELETE FROM giohang WHERE masp = ? AND size = ? "
        db.query(sql, [masp, size], (err, data) => {
            if (err) {
                return res.json(err)
            } else {
                return res.json(data)
            }
        })
    })
})
//end delete
// update gio hang mahd
app.post('/updatecartmahd', (req, res) => {
    const { makh, mahd } = req.body;

    const sql = "UPDATE giohang SET mahd = ? WHERE makh = ? AND mahd IS NULL";
    db.query(sql, [mahd, makh], (err, data) => {
        if (err) {
            console.error('Error updating cart mahd:', err);
            return res.status(500).json({ error: "Failed to update cart mahd" });
        }
        return res.json({ success: true, message: "Cart updated successfully", data });
    });
});
//end update gio hang mahd
//show hoadonchokh
app.get('/showhoadon/:id', (req, res) => {
    const sql = `
        SELECT 
            hoadon.mahd, 
            hoadon.ngaylaphoadon, 
            hoadon.tongsoluong, 
            hoadon.trangthai,
            hoadon.tongtien,
            hoadon.phuongthucthanhtoan,
            sanpham.tensp, 
            giohang.soluong, 
            giohang.gia
        FROM hoadon
        JOIN giohang ON hoadon.mahd = giohang.mahd
        JOIN sanpham ON giohang.masp = sanpham.masp
        WHERE hoadon.makh = ?
    `;
    db.query(sql, [req.params.id], (err, data) => {
        if (err) {
            console.error("Lỗi khi lấy dữ liệu:", err);
            return res.json(err);
        } else if (data.length === 0) {
            return res.json({ message: "Không có hóa đơn nào." });
        } else {
            return res.json(data);
        }
    });
});

//end hoadonchokh
// thanh toán momo
app.post('/payment', async (req, res) => {
    let {
        accessKey,
        secretKey,
        orderInfo,
        partnerCode,
        redirectUrl,
        ipnUrl,
        requestType,
        orderGroupId,
        autoCapture,
        lang,
    } = config;

    // Nhận số tiền và dữ liệu hóa đơn từ request
    const { amount, hoadon } = req.body;

    // Kiểm tra số tiền
    if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Số tiền không hợp lệ" });
    }

    // Làm tròn số tiền để đảm bảo đúng định dạng MoMo yêu cầu
    const finalAmount = Math.round(parseFloat(amount));

    // Kiểm tra dữ liệu hóa đơn
    if (!hoadon) {
        return res.status(400).json({ message: "Thông tin hóa đơn không hợp lệ" });
    }

    // Tạo orderId và requestId
    const orderId = partnerCode + new Date().getTime();
    const requestId = orderId;

    // Gán orderId làm mã thanh toán
    hoadon.mathanhtoan = orderId;

    // Xử lý và kiểm tra từng trường trong hóa đơn
    const extraData = JSON.stringify({
        hoadon: {
            tongsoluong: hoadon.tongsoluong || 0,
            tongtien: hoadon.tongtien || 0,
            ngaylaphoadon: hoadon.ngaylaphoadon || '',
            mathanhtoan: hoadon.mathanhtoan, // Cập nhật mathanhtoan từ orderId
            phuongthucthanhtoan: hoadon.phuongthucthanhtoan || '',
            trangthai: hoadon.trangthai || '',
            manv: hoadon.manv || '',
            makh: hoadon.makh || '',
        },
        cartItems: hoadon.cartItems || [], // Nếu có thêm thông tin về giỏ hàng
    });

    // Tạo rawSignature
    const rawSignature = [
        `accessKey=${accessKey}`,
        `amount=${finalAmount}`,
        `extraData=${extraData}`,
        `ipnUrl=${ipnUrl}`,
        `orderId=${orderId}`,
        `orderInfo=${orderInfo}`,
        `partnerCode=${partnerCode}`,
        `redirectUrl=${redirectUrl}`,
        `requestId=${requestId}`,
        `requestType=${requestType}`,
    ].join('&');

    // Ký rawSignature
    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    // Tạo requestBody
    const requestBody = {
        partnerCode: partnerCode,
        partnerName: 'Test',
        storeId: 'MomoTestStore',
        requestId: requestId,
        amount: finalAmount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        lang: lang,
        requestType: requestType,
        autoCapture: autoCapture,
        extraData: extraData, // Truyền dữ liệu vào extraData
        orderGroupId: orderGroupId,
        signature: signature,
    };

    console.log("Request body gửi tới MoMo:", requestBody); // Debug dữ liệu gửi đi

    const options = {
        method: 'POST',
        url: 'https://test-payment.momo.vn/v2/gateway/api/create',
        headers: {
            'Content-Type': 'application/json',
        },
        data: requestBody,
    };

    try {
        // Gửi request đến MoMo API
        const result = await axios(options);

        console.log("Kết quả từ MoMo API:", result.data); // Debug kết quả trả về từ MoMo

        // Kiểm tra kết quả
        if (result.data && result.data.payUrl) {
            return res.status(200).json({
                ...result.data,
                mathanhtoan: orderId, // Trả về mathanhtoan
            });
        } else {
            return res.status(500).json({
                message: "Không thể tạo liên kết thanh toán",
                data: result.data,
            });
        }
    } catch (error) {
        console.error("Lỗi từ MoMo API:", error.response ? error.response.data : error.message);
        return res.status(500).json({
            statusCode: 500,
            message: error.response ? error.response.data : error.message,
        });
    }
});



app.post('/callback', async (req, res) => {
    console.log('Callback received:', JSON.stringify(req.body, null, 2));

    if (req.body.resultCode === 0) { // Giao dịch thành công
        console.log('Giao dịch thành công');

        try {
            const extraData = req.body.extraData ? JSON.parse(req.body.extraData) : null;
            console.log('Parsed extraData:', extraData);

            if (extraData && extraData.hoadon) {
                const hoadon = extraData.hoadon;

                if (!hoadon.tongsoluong || !hoadon.tongtien || !req.body.orderId) {
                    console.error("Thiếu thông tin hóa đơn cần thiết:", {
                        tongsoluong: hoadon.tongsoluong,
                        tongtien: hoadon.tongtien,
                        orderId: req.body.orderId,
                    });
                    return res.status(400).json({ message: "Thiếu thông tin hóa đơn cần thiết." });
                }

                // Lưu hóa đơn vào database
                const values = [
                    hoadon.tongsoluong,
                    hoadon.tongtien,
                    hoadon.ngaylaphoadon,
                    req.body.orderId, // Mã giao dịch từ MoMo
                    hoadon.phuongthucthanhtoan,
                    hoadon.trangthai,
                    hoadon.manv,
                    hoadon.makh,
                ];

                const sqlString = `
                    INSERT INTO hoadon 
                    (tongsoluong, tongtien, ngaylaphoadon, mathanhtoan, phuongthucthanhtoan, trangthai, manv, makh) 
                    VALUES (?);
                `;
                db.query(sqlString, [values], (err, result) => {
                    if (err) {
                        console.error("Lỗi khi thêm hóa đơn:", err);
                        return res.status(500).json({ message: "Thêm hóa đơn thất bại" });
                    }

                    const idHoaDon = result.insertId; // Lấy mã hóa đơn vừa tạo
                    console.log('Hóa đơn được tạo thành công với mã:', idHoaDon);

                    // Cập nhật giỏ hàng với id_hoadon mới
                    const updateCartQuery = `
                        UPDATE giohang 
                        SET mahd = ? 
                        WHERE makh = ? 
                        AND trangthai = '1' 
                        AND mahd IS NULL;
                    `;
                    db.query(updateCartQuery, [idHoaDon, hoadon.makh], (updateErr, updateResult) => {
                        if (updateErr) {
                            console.error("Lỗi khi cập nhật giỏ hàng:", updateErr);
                            return res.status(500).json({ message: "Cập nhật giỏ hàng thất bại" });
                        }

                        console.log('Giỏ hàng được cập nhật thành công với id_hoadon:', idHoaDon);
                        return res.status(200).json({ message: 'Hóa đơn đã được tạo và giỏ hàng đã được cập nhật.' });
                    });
                });
            } else {
                throw new Error('extraData.hoadon không tồn tại');
            }
        } catch (error) {
            console.error('Error processing callback:', error);
            return res.status(500).json({ message: 'Lỗi xử lý callback.', error });
        }
    } else {
        console.log('Giao dịch thất bại:', req.body);
        return res.status(400).json({ message: 'Giao dịch thất bại' });
    }
});



app.post('/check-status-transaction', async (req, res) => {
    const { orderId } = req.body;

    // const signature = accessKey=$accessKey&orderId=$orderId&partnerCode=$partnerCode
    // &requestId=$requestId
    var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    var accessKey = 'F8BBA842ECF85';
    const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;

    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    const requestBody = JSON.stringify({
        partnerCode: 'MOMO',
        requestId: orderId,
        orderId: orderId,
        signature: signature,
        lang: 'vi',
    });

    // options for axios
    const options = {
        method: 'POST',
        url: 'https://test-payment.momo.vn/v2/gateway/api/query',
        headers: {
            'Content-Type': 'application/json',
        },
        data: requestBody,
    };

    const result = await axios(options);

    return res.status(200).json(result.data);
});


// end momomomo
//clear gio hàng sau khi thanh toán cod
app.get('/clearcart/:makh', (req, res) => {
    const { makh } = req.params;

    // Câu lệnh SQL xóa tất cả sản phẩm trong giỏ hàng của khách hàng
    const sql = 'DELETE FROM giohang WHERE makh = ?';

    db.query(sql, [makh], (err, result) => {
        if (err) {
            console.error('Lỗi khi xóa giỏ hàng:', err);
            return res.json({ status: 'error', message: 'Đã xảy ra lỗi trong quá trình xử lý.' });
        }

        if (result.affectedRows > 0) {
            return res.json({ status: 'success', message: 'Giỏ hàng đã được xóa.' });
        } else {
            return res.json({ status: 'fail', message: 'Không tìm thấy giỏ hàng để xóa.' });
        }
    });
});
// end 
app.listen(4000, () => {
    console.log("Sever running ")
})