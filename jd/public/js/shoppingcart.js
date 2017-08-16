$(function(){

$("#header").load("header.html",function(){
});
$("#footer").load("footer.html");
//功能1：读取上一页面保存 cookie
//用户名和用户编号
//解析uid和uname若没有则必须跳回"登录页面"
//1:读取cookie所有数据以; 拆分为数组
//  [loginUid=1][loginUname=qd]
  var cookieArray = document.cookie.split("; ");
//2:创建空对象
  var cookieObject = {};
//3:循环获取数组中每一个键和值 
  for(var i=0;i<cookieArray.length;i++){
    var pair = cookieArray[i].split("=");
    var key = pair[0];//loginUname
    var val = pair[1];//qd
    cookieObject[key]=val;
  }
if(!cookieObject.loginUid){
  location.href = "productlist.html";
}
$.ajax({
  url:'/orders',
  data:{uid:cookieObject.loginUid},
  success:function(data){
    var html = "";
    $.each(data,function(i,obj){
        html += `
<tr>
<td>
<input type="checkbox"/>
<input type="hidden" value="1" />
<div><img src="${obj.pic}" alt=""/></div>
</td>
<td><a href="">${obj.pname}</a></td>
<td>${obj.price}</td>
<td>
<button class="${obj.cid}">-</button>
<input type="text" value="${obj.count}"/>
<button class="${obj.cid}">+</button>
</td>
<td><span>${obj.price*obj.count}</span></td>
<td><a href="${obj.cid}" class="btn-delete">删除</a></td>
</tr>

        `;
    });
    //3:循环外将html赋值,tbody
    $("#cart tbody").html(html);
  }
});
$("#cart tbody").on("click","a:contains('删除')",function(e){ 
  e.preventDefault();
  var cid = $(this).attr("href");
  var self = this;

  $.ajax({
      url:"/delist",
      data:{cid:cid},
      success:function(data){
        if(data.code<0){
           alert("删除失败:"+data.msg);
        }else{
           alert("删除成功");
           $(self).parent().parent().remove();
        }
      }
  });
})
$("#cart tbody").on("click","button:contains('+')",function(e){
  var cid = $(this).attr("class");
  var self = this;
  $.ajax({
    url:"/upcount",
    data:{cid:cid},
    success:function(data){
      if(data.code>0){
       var inputCount = $(self).prev();
       var inputNum = parseInt(inputCount.val())+1;
       inputCount.val(inputNum);
       var priceInput = $(self).parent().prev().html();
       var nextTd = $(self).parent().next();
       var sum = priceInput*inputNum;
       nextTd.html("<span>￥"+sum+"</span>");
      }
    }
  });
});  
$("#cart tbody").on("click","button:contains('-')", function(e){
  var cid = $(this).attr("class");
  var self = this;
  $.ajax({
    url:"/downcount",
    data:{cid:cid},
    success:function(data){
      if(data.code>0){
       var inputCount = $(self).next();
       var inputNum = parseInt(inputCount.val())-1;
         if(parseInt(inputCount.val())>1){
           console.log(inputNum);
           inputCount.val(inputNum);
           var priceInput = $(self).parent().prev().html();
           var nextTd = $(self).parent().next();
           var sum = priceInput*inputNum;
           nextTd.html("<span>￥"+sum+"</span>");
         }else if(inputNum==0){
            alert('再减就没有啦，想要删除?');
            $.ajax({
              url:"data/shopping_del_07.php",
              data:{cid:cid},
              success:function(data){
                if(data.code<0){
                   alert("删除失败:"+data.msg);
                }else{
                   alert("删除成功");
                   $(self).parent().parent().remove();
                }
              }
            });
          }   
      }
    }
  });
}); 
});