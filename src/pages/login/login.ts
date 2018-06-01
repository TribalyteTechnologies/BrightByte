import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { utf8Encode } from '@angular/compiler/src/util';
import { NewuserPage } from '../newuser/newuser'
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  // public text: string;
  public text: string;
  constructor(public navCtrl: NavController) {

  }
  //public upload() {
    /*
    ///const file = document.getElementById("file");
    const reader = new FileReader();
    //reader.readAsText(file ,utf8Encode);
    reader.readAsBinaryString = (file) => {
      //this.text = reader.result;
      this.text = reader.result;
    console.log("File contents: " + this.text);
      //const buf = new Buffer(reader.result) // Convert data into buffer
     // console.log(reader.readAsText(contents));

    }
    //reader.readAsArrayBuffer(file.files[0]); // Read Provided File
    //let a = new FileReader.readAsText(file, utf8Encode);
    console.log(this.text);
   */
  public openFile = (event: Event)=> {
    console.log("Event: ", event);
    let target = <HTMLInputElement>event.target;
    let uploadedArray = <FileList>target.files;
    console.log("Target: ", target);
    
    let input = uploadedArray[0];
    console.log("Input: ", input);

    let reader = new FileReader();
    reader.readAsText(input);
    let me = this;
    reader.onload = function(){
      //let dataURL = reader.result;
      //let output = document.getElementById('output');
      //output.innerHTML = dataURL;
      //console.log(dataURL);
      me.text = JSON.parse(reader.result); 
      //me.text = reader.result;
      //console.log(me.text);
    };
    // this.text=reader.readAsText(input);
    //console.log("Reader result: ", this.text);
  };
  //}
  
public register(){
    this.navCtrl.push(NewuserPage);
}

}
