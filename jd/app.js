//1:整个项目主模块文件
//负责创建web服务器对象,监听指定端口
//并向客户端提供静态资源+动态资源服务
const pool = require("./pool");
const http = require("http");
const express = require("express");
const qs = require("querystring");

//2:创建express对象
var app = express();
//3:创建web服务器 参数
var server = http.createServer(app);
//4:绑定监听端口
server.listen(8080);
//5:请求处理静态资源
app.use(express.static('public'));

//6:请求处理动态资源
//客户发送 /请求   如 http://127.0.0.1:8080/
//程序自动跳转 login.html页面请用户登录
app.get("/",(req,res)=>{
  res.redirect('login.html');
});
//7:模块一:用户登录
app.post("/login",(req,res)=>{
    //1:为req对象绑定事件  data
    req.on("data",(data)=>{
      //2:解析其中的参数对象 obj
      var obj = qs.parse(data.toString());
      //3:获取连接
      pool.getConnection((err,conn)=>{
        //4:创建SQL语句并且发送sql
        var sql = "SELECT * FROM jd_user";
        sql += " WHERE uname = ? AND upwd = ?";
        //5:判断??
        conn.query(sql,[obj.uname,obj.upwd],(err,result)=>{
          //5:判断??
          if(result.length>0){
            var output = {
              code:1,
              msg:"登录成功",
              uid:result[0].uid
            };
          }else{//未查询到数据.
            var output = {
              code:2,
              msg:"用户名或密码错误"
            };
          }
          res.json(output);//把数据转化为json
          conn.release();  //释放连接
        });
      });
    });
});
//7:模块二:用户注册
app.post("/register",(req,res)=>{
  //1:解析用户提交参数uname upwd homepage
  req.on("data",(data)=>{
    var obj = qs.parse(data.toString());
    //2:获取连接
    pool.getConnection((err,conn)=>{
      //3:创建SQL语句，并且发送SQL语句
    var sql = "INSERT INTO jd_user VALUES(NULL,?,?,?)";
      //4:获取返回结果
      conn.query(sql,[obj.uname,obj.upwd,obj.homepage],(err,result)=>{
        if(err)throw err;
        var output = {code:1,msg:"注册成功"};
        res.json(output);
        conn.release();
      });
    });
  });
});
//模块三，商品主页面
app.get('/productlist',(req,res)=>{
  var pageNum=req.query.pageNum ||1;
  console.log(pageNum);
  var offset=(pageNum-1)*8;
  pool.getConnection((err,conn)=>{
    var sql="SELECT * FROM jd_product limit ?,8";
    conn.query(sql,[offset],(err,result)=>{
      if(err) throw err;
        res.json(result);
        conn.release();//释放连接
    })
  })
});
//模块四：总页数
app.get("/pagetotals",(req,res)=>{
  pool.getConnection((err,conn)=>{
    var sql='SELECT count(pid) as c FROM jd_product';
    conn.query(sql,(err,result)=>{
      if(err) throw err;
      var page={};
      var temp=result[0]["c"];
      page.total=Math.ceil(result[0]["c"]/8);
      res.json(page);
      conn.release();
    })
  })
})
//模块五：添加至购物车功能
app.get('/addcart',(req,res)=>{
 var uid= req.query.uid || 2;
 var pid= req.query.pid || 3;
 pool.getConnection((err,conn)=>{
    var sql="SELECT count FROM t_cart WHERE uid=? AND pid=?";
    conn.query(sql,[uid,pid],(err,result)=>{
      if(result==null){
        var sql = " INSERT INTO t_cart VALUES(null, ?, ?,1)";
        conn.query(sql,[uid,pid],(err,result)=>{
          console.log(1);
          console.log(result);
          var arr={code:1,msg:'添加成功',count:result};
          res.json(arr);
          conn.release();
        })
      } 
       else{
        var sql="UPDATE t_cart SET count=count+1 WHERE uid = ? AND pid=?";
        conn.query(sql,[uid,pid],(err,result)=>{
          var sql='SELECT count FROM t_cart WHERE uid = ? AND pid=?';          
            conn.query(sql,[uid,pid],(err,result)=>{
              console.log(2);
              console.log(result);
              var arr={code:1,msg:'添加成功',count:result};
              res.json(arr);
              conn.release();     
            })
          })        
        }
      })
    })
 })
//模块五：购物车详情功能
app.post("/cartdetail",(req,res)=>{
  req.on('data',(data)=>{
    var obj = qs.parse(data.toString());
        var uid=obj.uid;
        var pid=obj.pid;
     pool.getConnection((err,conn)=>{
        var sql='SELECT * FROM t_cart WHERE uid = ? and pid=?';
        conn.query(sql,[uid,pid],(err,result)=>{
          var count=1;
          if(result==null){
            var sql="INSERT INTO t_cart VALUES(null,?,?,1)";
            conn.query(sql,[uid,pid],(err,result)=>{
             var count=result[0]["count"];
                   var arr={code:1,count:count};
                   res.json(arr);
                   conn.release();
            })
          }else{
            var sql="UPDATE t_cart SET count=count+1 WHERE uid = ? AND pid = ?";
            conn.query(sql,[uid,pid],(err,result)=>{
              var sql='SELECT * FROM t_cart WHERE uid = ? and pid=?';
               conn.query(sql,[uid,pid],(err,result)=>{
                   var count=result[0]["count"];
                   var arr={code:1,count:count};
                   res.json(arr);
                   conn.release();
               })
            })
          }
        })
     })
   })
})
//模块六：购物车列表
app.get("/orders",(req,res)=>{
 //2:获取当前用户的编号 uid
  var sql ="SELECT d.did,p.pic,p.pname,p.price,d.count";
  sql +=" from jd_order o,jd_order_detail ";
  sql +=" d,jd_product p";
  sql +=" WHERE o.oid=d.orderId";
  sql +="      AND";
  sql +="      d.productId = p.pid";
  sql +="      AND";
  sql +="      o.userId= ?";
//1:创建动态 GET /orders
 var uid = req.query.uid;
//3:查询指定编号订单全部信息
 pool.getConnection((err,conn)=>{
   if(err)throw err;
   conn.query(sql,[uid],(err,result)=>{
     res.json(result);
     conn.release();//释放连接
   });
 });
});
//模块七:删除功能实现
app.get('/delist',(req,res)=>{
  var cid=req.query.cid;
  var sql='DELETE FROM t_cart WHERE cid = ?'
  pool.getConnection((err,conn)=>{
    if (err) throw err;
    conn.query(sql,[cid],(err,result)=>{
      var arr={code:1,msg:'删除成功'};
      res.json(arr);
      conn.release();
    })
  })
})
//模块八:动态加实现
 app.get('/upcount',(req,res)=>{
  var cid=req.query.cid || 6 ;
  var sql='SELECT ';
  pool.getConnection((err,conn)=>{
    var sql='UPDATE t_cart SET count=count+1 WHERE cid=?';
    if (err) throw err;
    conn.query(sql,[cid],(err,result)=>{
      var sql='SELECT count FROM t_count WHERE cid=?';
      conn.query(sql,[cid],(err,result)=>{
          var arr={code:1,msg:'添加成功'};
          res.json(result);
          conn.release();
      })
    })
  })
 });
//模块九:动态减实现
  app.get('/downcount',(req,res)=>{
  var cid=req.query.cid || 6 ;
  var sql='UPDATE t_cart SET count=count-1 WHERE cid=?';
  pool.getConnection((err,conn)=>{
    if (err) throw err ;
    conn.query(sql,[cid],(err,result)=>{
     var sql='SELECT count FROM t_count WHERE cid=?';
      conn.query(sql,[cid],(err,result)=>{
          var arr={code:1,msg:'添加成功'};
          res.json(arr);
          conn.release();
      })
    })
  })
 })
//模块十:svg消息统计图 
app.get("/svgstat",(req,res)=>{
  var output = [
    {lable:"1月",value:1000},
    {lable:"2月",value:1100},
    {lable:"3月",value:1200},
    {lable:"4月",value:1300},
    {lable:"5月",value:1400},
    {lable:"6月",value:9000},
    {lable:"7月",value:900},
    {lable:"8月",value:1200},
    {lable:"9月",value:1300},
    {lable:"10月",value:1400},
    {lable:"11月",value:1900},
    {lable:"12月",value:2100}
  ];
  res.json(output);
});
