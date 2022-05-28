document.getElementById('copy').addEventListener("click",function(){
		let copyTextarea = document.querySelector('#comment');
        copyTextarea.focus();
        copyTextarea.select();
        try {
          let successful = document.execCommand('copy');
          let msg = successful ? 'successful' : 'unsuccessful';
          if(msg==='successful'){
          	    document.getElementById('copy').innerHTML="copied!";
          	    setTimeout(function () {
				document.getElementById('copy').innerHTML="COPY";
				}, 2000);
          }
		} catch(err) {
          alert('Unable to copy');
        }
});
