$(function(){

//功能1:待页面加载完成后，异步
//异请求页头页尾
$("#header").load("header.html",function(){
});
$("#footer").load("footer.html");
$("#bt-login").click(function(){
 //2.1:获取用户名，密码
 var n = $("[name='uname']").val();
 var p = $("[name='upwd']").val();
 //2.2:发送ajax $.ajax();
 $(".modal").hide();
 $.ajax({
   type:'POST',
   url:'/login',
   data:{uname:n,upwd:p},
   success:function(data){
      if(data.code==2){
        $('p.alert').html(data.msg);
      }else{
        //隐藏模态框
        $(".modal").hide();
        loginUid = data.uid;
        loginUname = data.uname;
        //console.log(loginUid+":"+loginUname);
      }
   }
 });
});
//创建二个全局变量
var loginUid = 0;
var loginUname = 0;
//功能点3:发起异步请求，获取产品列表
//pageNo 参数表示:当前页码
function loadProduct(pageNo){
   $.ajax({
     type:'GET',
     data:{pageNo:pageNo},
     url:'/productlist',
     success:function(data){
      //3:接字符串      
      var html = "";
      $.each(data,function(i,p){
        html += `
<li>
    <a href=""><img src="${p.pic}" alt=""/></a>
    <p>￥${p.price}</p>
    <h1><a href="">${p.pname}</a></h1>
    <div>
        <a href="" class="contrast"><i></i>对比</a>
        <a href="" class="p-operate"><i></i>关注</a>
        <a href="${p.pid}" class="addcart"><i></i>加入购物车</a>
    </div>
</li>
        `;   
      });
      $("#plist ul").html(html);
     }
   });
   //2:再次发送 ajax请求获取总页数 
   //拼接字符串
   $.ajax({
     url:"/pagetotals",
     success:function(data){
       var pageTotal = data.page;
       //拼接字符串
       var html = "";
       for(var i=1;i<=pageTotal;i++){
          if(i==pageNo){
            html += `
        <li class="active"><a href="#">${i}</a></li>
            `;
          }else{
          html += `
            <li><a href="#">${i}</a></li>
          `;
          }
       }
       $("ol.pager").html(html);
     }
   });
}
loadProduct(1);
//功能4：为分页条超链接绑定点击事件
//由于该元素是动态创建使用代理绑定
$("ol.pager").on("click","li a",function(e){
   //1:阻止事件默认行为
   e.preventDefault();
   //2:获取当前按钮页码
   var p = $(this).text();
   //3:发送请求
   loadProduct(p);
});
//功能点5：为每个商品下面"添加到购物车"
//绑定监听--事件代理
$("#plist").on("click","a.addcart",function(e){
   //1:阻止默认行为
   e.preventDefault();
   //2:获取产品id
   var pid = $(this).attr("href");
   console.log(pid);
   $.ajax({
     url:"/addcart",
     data:{uid:loginUid,pid:pid},
     success:function(data){
       if(data.code<0){
         alert("添加失败,错误原因"+data.msg);
       }else{
         alert("添加成功, 该商品购买数量"+data.count);
       }
     }
   });
});
$(document.body).on("click","#settle_up",
  function(e){
  //1:把当前登录用户名uid保存cookie
  document.cookie = 'loginUid='+loginUid;
  document.cookie = 'loginUname='+loginUname;
  //2:自动转换
  location.href = "shoppingcart.html";
});
});