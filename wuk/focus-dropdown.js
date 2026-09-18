(function(){
'use strict';
const select=document.getElementById('focus'),panel=document.getElementById('focusDropdown'),summary=document.getElementById('focusSummary'),menu=document.getElementById('focusMenu');
if(!select||!panel)return;
for(const option of select.options){
 const label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');
 input.type='radio';input.name='operational-focus';input.value=option.value;input.checked=option.value===select.value;text.textContent=option.textContent;
 input.addEventListener('change',function(){if(!input.checked)return;select.value=input.value;select.dispatchEvent(new Event('change',{bubbles:true}));panel.open=false;summary.focus();});
 label.append(input,text);menu.append(label);
}
function sync(){summary.textContent=select.selectedOptions[0]?.textContent||'All operational areas';for(const input of menu.querySelectorAll('input'))input.checked=input.value===select.value;}
select.addEventListener('change',sync);document.getElementById('clear').addEventListener('click',sync);
panel.addEventListener('toggle',function(){if(panel.open)document.querySelector('#summary').closest('details').open=false;});
document.querySelector('#summary').closest('details').addEventListener('toggle',function(){if(this.open)panel.open=false;});
menu.addEventListener('keydown',function(e){if(e.key==='Escape'){panel.open=false;summary.focus();}});
sync();
})();
