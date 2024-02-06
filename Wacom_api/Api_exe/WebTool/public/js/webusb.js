'use strict';
// ===========================================================================================
// このWebUSBのコードは、IoT Paper のアクセスを行う為に作成されています。
// IoT Paperに送信またはIoT Paperから受信するinkmlデータは、複数のページを扱う事を前提に、
// インクルードを行う本体のコードに定義された配列、fcon[]テーブルを参照しています。
// ここにinkmlデータが表示ページ毎に収まっていて、ここから読み出してIoT Paperに送信したり、
// 書き込みが終わって読み出したinkmlデータをパラメータのテーブルオフセットに従い格納したりします。
// 実際にアクセスするファイル情報は暫定のまま使用しているので、Webサーバーに格納する際に適切に処理してください。
// ===========================================================================================

  const getobjecthandle_packet = Uint8Array.of(24,0,0,0, 1,0, 7,16, 3,0,0,0, 1,0,1,0, 0,0,0,0, 0,0,0,0);
  const getobjectinfo1_packet = Uint8Array.of(16,0,0,0, 1,0, 8,16, 4,0,0,0, 1,0,0,0);
  const getobject_packet = Uint8Array.of(16,0,0,0, 1,0, 9,16, 6,0,0,0, 2,0,0,0);
  const sendobject_packet = Uint8Array.of(12,0,0,0, 1,0, 13,16, 8,0,0,0);

  const sendinkmlinfo_packet = Uint8Array.of(20,0,0,0, 1,0, 12,16, 7,0,0,0, 1,0,1,0, 1,0,0,0); // placed on PAGE_001 (=1) 
  const sendinkmlinfo = Uint8Array.of(164,0,0,0, 2,0, 12,16, 7,0,0,0, 0,0,0,0, 0,48, 0,0, 0,0,0,0, 0,0,0,0, 
  						0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0, 0,0,0,0, 0,0,0,0, 
  						12, 84,0,101,0,115,0,116,0,49,0,46,0,105,0,110,0,107,0,109,0,108,0,0,0,
  						18, 50,0,48,0,50,0,50,0,48,0,51,0,49,0,52,0,84,0,48,0,56,0,48,0,48,0,48,0,48,0,46,0,0,0,0,0,
  						18, 50,0,48,0,50,0,50,0,48,0,51,0,49,0,52,0,84,0,48,0,56,0,48,0,48,0,48,0,48,0,46,0,0,0,0,0, 0);
  const sendobject_inkml = Uint8Array.of(12,0,0,0, 2,0, 13,16, 8,0,0,0);

  const sendobjectinfo_packet = Uint8Array.of(20,0,0,0, 1,0, 12,16, 7,0,0,0, 1,0,1,0, 0,0,0,0); // placed on root (=0) 
  const sendobjectinfo = Uint8Array.of(158,0,0,0, 2,0, 12,16, 7,0,0,0, 0,0,0,0, 0,48, 0,0, 0,0,0,0, 0,0,0,0, 
  						0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0, 0,0,0,0, 0,0,0,0, 
  						9, 115,0,97,0,118,0,101,0,46,0,116,0,120,0,116,0,0,0,
  						18, 50,0,48,0,50,0,50,0,48,0,51,0,49,0,52,0,84,0,48,0,56,0,48,0,48,0,48,0,48,0,46,0,0,0,0,0,
  						18, 50,0,48,0,50,0,50,0,48,0,51,0,49,0,52,0,84,0,48,0,56,0,48,0,48,0,48,0,48,0,46,0,0,0,0,0, 0);
  const sendobject_savetxt = Uint8Array.of(12,0,0,0, 2,0, 13,16, 8,0,0,0);
  const deleteobject = Uint8Array.of(16,0,0,0, 1,0, 11,16, 8,0,0,0, 3,0,0,0);

  let device;
  let rescode;
  let result = 0;
  let objectNum = 0;
  let handler = [];
  let assocType = [];
  let fileSize = [];
  let filenameSize = [];	
  let filenameBuffer = [];
  let fileName;
  let savefilesize;
  let delinkmlHandle = 0;
  let updateHandle = 0;
  let delupdateHandle = 0;
  let testMode = 0;
  let filelength = 0;
  let fileContentBuffer = [];
  let fileContent;
  let ioprocess = 0;
  let productid = 0;
  let serialnumber = 0;

  let transactionID = 0;
  let storageID = 0;
  let finishWriting = 0;


async function auth() {
  ioprocess = 1; // processing flag
  const filters = [
      { vendorId: 0x2d1f, productId: 0x020a }  // IoT Paper 10inch for WebUSB
    , { vendorId: 0x2d1f, productId: 0x016f }  // IoT Paper 10inch
  ];

  try {
  		device = await navigator.usb.requestDevice({filters: filters});
  		//device = await navigator.usb.getDevice({filters: filters});
		productid = device.productId;
		serialnumber = device.serialNumber;
		console.log("Product name: " + device.productName);
		console.log("Manufacturer: " + device.manufacturerName);
		console.log("Serial Number: " + serialnumber);
		console.log("Product ID: " + productid);
        console.log(device);
		
		
	//=== MTP device open ===
	    await device.open();
	    console.log("device open : " + device.configuration);
	    if (device.configuration === null) {
	    	console.log("selectConfiguration");
		    await device.selectConfiguration(1);
		}
		console.log("configuration done");
	    await device.claimInterface(0);
	    console.log("claim interface ");

		
	//=== MTP get device info ===
		const ack_packet = Uint8Array.of(12,0,0,0, 1,0, 1,16, 0,0,0,0);
		result = await device.transferOut(2, ack_packet);  // command 0x1001
	    console.log("DeviceInfo Request phase ");
		result = await device.transferIn(1, 512);
	    console.log("DeviceInfo Data Phase ");
		console.log(result.data.buffer);
		result = await device.transferIn(1, 512);
	    console.log("DeviceInfo Response Phase ");


	//=== MTP open session ===
		transactionID = 0;
		const open_packet = Uint8Array.of(16,0,0,0, 1,0, 2,16, 0,0,0,0, 1,0,0,0);

		open_packet[11] = (transactionID / 0x1000000) & 0xFF;
		open_packet[10] = (transactionID / 0x10000) & 0xFF;
		open_packet[9] = (transactionID / 0x100) & 0xFF;
		open_packet[8] = transactionID & 0xFF;
		console.log(open_packet);
		
		result = await device.transferOut(2, open_packet);  // command 0x1002
	    console.log("OpenSession Request   " + transactionID);
		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("OpenSession OK");
		else console.log("OpenSession FAIL!");


	//=== MTP get storageID : set "storageID" to storageID ===
		const getstorageid_packet = Uint8Array.of(12,0,0,0, 1,0, 4,16, 1,0,0,0);
		transactionID++;

		getstorageid_packet[11] = (transactionID / 0x1000000) & 0xFF;
		getstorageid_packet[10] = (transactionID / 0x10000) & 0xFF;
		getstorageid_packet[9] = (transactionID / 0x100) & 0xFF;
		getstorageid_packet[8] = transactionID & 0xFF;
		//console.log(getstorageid_packet);
		result = await device.transferOut(2, getstorageid_packet);  // command 0x1004
	    console.log("GetStorageID Request   " + transactionID);
		result = await device.transferIn(1, 512);
		//console.log(result.data.buffer);
	    //console.log("GetStorageID Data phase");
		let storageIdBuffer = new Uint32Array(result.data.buffer);
		console.log("  received data size = " + storageIdBuffer[0]);
		storageID = storageIdBuffer[4];
		console.log("  storageID = " + storageID);
		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("GetStorageID OK");
		else console.log("GetStorageID FAIL!");


	//=== MTP get storage info : contains storage name and size ===
		const getstorageinfo_packet = Uint8Array.of(16,0,0,0, 1,0, 5,16, 2,0,0,0, 1,0,1,0);
		transactionID++;

		getstorageinfo_packet[11] = (transactionID / 0x1000000) & 0xFF;
		getstorageinfo_packet[10] = (transactionID / 0x10000) & 0xFF;
		getstorageinfo_packet[9] = (transactionID / 0x100) & 0xFF;
		getstorageinfo_packet[8] = transactionID & 0xFF;
		getstorageinfo_packet[15] = (storageID / 0x1000000) & 0xFF;
		getstorageinfo_packet[14] = (storageID / 0x10000) & 0xFF;
		getstorageinfo_packet[13] = (storageID / 0x100) & 0xFF;
		getstorageinfo_packet[12] = storageID & 0xFF;
		//console.log(getstorageinfo_packet);

		result = await device.transferOut(2, getstorageinfo_packet);  // command 0x1005
	    console.log("GetStorageInfo Request   " + transactionID);
		result = await device.transferIn(1, 512);
		let storageinfoBuffer = new Uint16Array(result.data.buffer);
		console.log("  Storage type      = " + storageinfoBuffer[6] + "   : 3 is Fixed RAM");
		console.log("  FileSystem type   = " + storageinfoBuffer[7] + "   : 2 is Hierarchical");
		console.log("  Access capability = " + storageinfoBuffer[8] + "   : 0 is Read/Write");
	    //console.log("GetStorageInfo Data phase");
		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("GetStorageInfo OK");
		else console.log("GetStorageInfo FAIL!");


	//=== MTP get object handle : contains object handle number ===
		transactionID++;
		getobjecthandle_packet[11] = (transactionID / 0x1000000) & 0xFF;
		getobjecthandle_packet[10] = (transactionID / 0x10000) & 0xFF;
		getobjecthandle_packet[9] = (transactionID / 0x100) & 0xFF;
		getobjecthandle_packet[8] = transactionID & 0xFF;
		getobjecthandle_packet[15] = (storageID / 0x1000000) & 0xFF;
		getobjecthandle_packet[14] = (storageID / 0x10000) & 0xFF;
		getobjecthandle_packet[13] = (storageID / 0x100) & 0xFF;
		getobjecthandle_packet[12] = storageID & 0xFF;
		//console.log(getobjecthandle_packet);
		result = await device.transferOut(2, getobjecthandle_packet);  // command 0x1007
	    console.log("GetObjectHandle Request   " + transactionID);
		result = await device.transferIn(1, 512);
	    //console.log("GetObjectHandle Data phase");
	    
		let handlerBuffer = new Uint32Array(result.data.buffer);
		//console.log("  received data size = " + handlerBuffer[0]);
		objectNum = handlerBuffer[3];
		console.log("  ObjectHandler number = " + objectNum);
		for (let i=0; i<objectNum; i++) {
			handler[i] = handlerBuffer[i+4];
			console.log("  ObjectHandler" + (i+1) + " = " + handler[i]);
		}
		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("GetObjectHandle OK");
		else console.log("GetObjectHandle FAIL!");

	    
	//=== MTP get object1 info : contains association type and name, may be "PAGE_001" ===
		transactionID++;
		getobjectinfo1_packet[11] = (transactionID / 0x1000000) & 0xFF;
		getobjectinfo1_packet[10] = (transactionID / 0x10000) & 0xFF;
		getobjectinfo1_packet[9] = (transactionID / 0x100) & 0xFF;
		getobjectinfo1_packet[8] = transactionID & 0xFF;
		getobjectinfo1_packet[15] = (handler[0] / 0x1000000) & 0xFF;
		getobjectinfo1_packet[14] = (handler[0] / 0x10000) & 0xFF;
		getobjectinfo1_packet[13] = (handler[0] / 0x100) & 0xFF;
		getobjectinfo1_packet[12] = handler[0] & 0xFF;
		//console.log(getobjectinfo1_packet);
		result = await device.transferOut(2, getobjectinfo1_packet);  // command 0x1008
	    console.log("GetObjectInfo Request   " + transactionID);
		result = await device.transferIn(1, 512);
	    //console.log("GetObjectInfo Data phase");

		let objectBuffer1 = new Uint16Array(result.data.buffer);
		//console.log("  received data size = " + objectBuffer1[0]);
		assocType[0] = objectBuffer1[27];
		//console.log("  Association Type 1 = " + assocType[0]);
		if (assocType[0] == 1) console.log("  This object(1) is a Folder");
		else console.log("  This object(1) is a File data");
		objectBuffer1 = new Uint8Array(result.data.buffer);
		filenameSize[0] = objectBuffer1[64];
		//console.log("  File name size = " + filenameSize[0]);

		for (let j=0; j < filenameSize[0]; j++){
			filenameBuffer[j] = objectBuffer1[65 + j*2];
			filenameBuffer[j+1] = 0;
			filenameBuffer[j+2] = 0;
		}
		var text_decoder = new TextDecoder("utf-8");
		fileName = text_decoder.decode(Uint8Array.from(filenameBuffer).buffer);
		console.log("  File name of ObjectHandler1 = " + fileName);

		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("GetObjectInfo OK");
		else console.log("GetObjectInfo FAIL!");


	//=== MTP get object2 info : contains association type and name, may be "config.json" ===
		transactionID++;
		getobjectinfo1_packet[11] = (transactionID / 0x1000000) & 0xFF;
		getobjectinfo1_packet[10] = (transactionID / 0x10000) & 0xFF;
		getobjectinfo1_packet[9] = (transactionID / 0x100) & 0xFF;
		getobjectinfo1_packet[8] = transactionID & 0xFF;
		getobjectinfo1_packet[15] = (handler[1] / 0x1000000) & 0xFF;
		getobjectinfo1_packet[14] = (handler[1] / 0x10000) & 0xFF;
		getobjectinfo1_packet[13] = (handler[1] / 0x100) & 0xFF;
		getobjectinfo1_packet[12] = handler[1] & 0xFF;
		//console.log(getobjectinfo1_packet);
		result = await device.transferOut(2, getobjectinfo1_packet);  // command 0x1008
	    console.log("GetObjectInfo Request   " + transactionID);
		result = await device.transferIn(1, 512);

		objectBuffer1 = new Uint16Array(result.data.buffer);
		fileSize[1] = (objectBuffer1[11] * 0x10000 + objectBuffer1[10]);
		//console.log("  received data size = " + objectBuffer1[0]);
		console.log("  Object file size = " + fileSize[1]);
		let parentObj = objectBuffer1[25] + (objectBuffer1[26] * 0x10000);
		console.log("  Parent Object Handle = " + parentObj);
		assocType[1] = objectBuffer1[27];
		//console.log("  Association Type 2 = " + assocType[1]);
		if (assocType[1] == 1) console.log("  This object(2) is a Folder");
		else console.log("  This object(2) is a File data");
		objectBuffer1 = new Uint8Array(result.data.buffer);
		filenameSize[1] = objectBuffer1[64];
		//console.log("  File name size = " + filenameSize[1]);

		for (let j=0; j < filenameSize[1]; j++){
			filenameBuffer[j] = objectBuffer1[65 + j*2];
			filenameBuffer[j+1] = 0;
			filenameBuffer[j+2] = 0;
		}
		text_decoder = new TextDecoder("utf-8");
		fileName = text_decoder.decode(Uint8Array.from(filenameBuffer).buffer);
		console.log("  File name of ObjectHandler2 = " + fileName);

		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001)
		    console.log("GetObjectInfo OK");
		else console.log("GetObjectInfo FAIL!");

		testMode = 1;
		
		ioprocess = 0; // processing flag off

		//filelength = fcon[0].length;					// get inkml file size (tentative)
		//fileContent = fcon[0];						// 

		//console.log(filelength);
		//console.log(fileContent);

  } catch (err) {
		console.log("no device selected " + result + ":" + err);
		ioprocess = 0; // processing flag off
  }

}

async function auth2(testpage) {
  try {
	ioprocess = 1; // processing flag on

	if (testMode == 1) {

	//=== MTP Send Object Info : send Inkml file information ===
		console.log("* Send Inkml file *");
		transactionID++;
		//for sending the Inkml file
		fileContent = fcon[testpage];
		filelength = fileContent.length;

		console.log("Inkml file size = " + filelength);  // Inkml test file size
		sendinkmlinfo_packet[11] = (transactionID / 0x1000000) & 0xFF;
		sendinkmlinfo_packet[10] = (transactionID / 0x10000) & 0xFF;
		sendinkmlinfo_packet[9] = (transactionID / 0x100) & 0xFF;
		sendinkmlinfo_packet[8] = transactionID & 0xFF;
		sendinkmlinfo_packet[15] = (storageID / 0x1000000) & 0xFF;
		sendinkmlinfo_packet[14] = (storageID / 0x10000) & 0xFF;
		sendinkmlinfo_packet[13] = (storageID / 0x100) & 0xFF;
		sendinkmlinfo_packet[12] = storageID & 0xFF;
		//filelength = inkmlTest.length;					// get inkml file size
		sendinkmlinfo[11] = (transactionID / 0x1000000) & 0xFF;
		sendinkmlinfo[10] = (transactionID / 0x10000) & 0xFF;
		sendinkmlinfo[9] = (transactionID / 0x100) & 0xFF;
		sendinkmlinfo[8] = transactionID & 0xFF;
		sendinkmlinfo[23] = (filelength / 0x1000000) & 0xFF;
		sendinkmlinfo[22] = (filelength / 0x10000) & 0xFF;
		sendinkmlinfo[21] = (filelength / 0x100) & 0xFF;
		sendinkmlinfo[20] = filelength & 0xFF;

		dateUpdate( 64+24+2 );
		//console.log(sendinkmlinfo);
		savefilesize = filelength; // for testing


		//console.log(sendinkmlinfo_packet);
		result = await device.transferOut(2, sendinkmlinfo_packet);  // command 0x100C
	    console.log("SendObjectInfo Request   " + transactionID);

		result = await device.transferOut(2, sendinkmlinfo);  // command 0x100C
	    console.log("SendObjectInfo data");		//console.log(sendobjectinfo);

		result = await device.transferIn(1, 24);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("SendObjectInfo OK");
		else console.log("SendObjectInfo FAIL!  " + rescode[3]);


	//=== MTP Send Object : send Inkml file under PAGE_001 folder ===
		transactionID++;
		sendobject_packet[11] = (transactionID / 0x1000000) & 0xFF;
		sendobject_packet[10] = (transactionID / 0x10000) & 0xFF;
		sendobject_packet[9] = (transactionID / 0x100) & 0xFF;
		sendobject_packet[8] = transactionID & 0xFF;
		
		sendobject_inkml[11] = (transactionID / 0x1000000) & 0xFF;
		sendobject_inkml[10] = (transactionID / 0x10000) & 0xFF;
		sendobject_inkml[9] = (transactionID / 0x100) & 0xFF;
		sendobject_inkml[8] = transactionID & 0xFF;

		let infolength = filelength + 12;
		let sendobject_inkml1 = new Uint8Array(infolength); // data set buffer
		let encodetest = new TextEncoder;
		//let inkmltext = encodetest.encode(inkmlTest);	// binary data encode to Uint8Array
		let inkmltext = encodetest.encode(fileContent);	// binary data encode to Uint8Array

		for (let i=0; i<12; i++) {
			sendobject_inkml1[i] = sendobject_inkml[i]; // command header set
		}
		for (let i=0; i<filelength; i++) {
			sendobject_inkml1[i+12] = inkmltext[i];		// inkml data set
		}
		sendobject_inkml1[3] = (infolength / 0x1000000) & 0xFF;
		sendobject_inkml1[2] = (infolength / 0x10000) & 0xFF;
		sendobject_inkml1[1] = (infolength / 0x100) & 0xFF;
		sendobject_inkml1[0] = infolength & 0xFF;

		result = await device.transferOut(2, sendobject_packet);  // command 0x100D
	    console.log("SendObject Request   " + transactionID);
		//console.log(sendobject_inkml1);
		result = await device.transferOut(2, sendobject_inkml1);  // command 0x100D
	    console.log("SendObject data");
	    //console.log("  Data phase : " + sendobject_inkml1);

		result = await device.transferIn(1, 12);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) {
		    console.log("SendObject OK");
		    console.log("* sending Inkml file complete *");
		} else {
			console.log("SendObject FAIL!");
		}


	//=== MTP get object handle : contains object handle number ===
		console.log("* Check whether the sending file is exist *");
		transactionID++;
		getobjecthandle_packet[11] = (transactionID / 0x1000000) & 0xFF;
		getobjecthandle_packet[10] = (transactionID / 0x10000) & 0xFF;
		getobjecthandle_packet[9] = (transactionID / 0x100) & 0xFF;
		getobjecthandle_packet[8] = transactionID & 0xFF;
		getobjecthandle_packet[15] = (storageID / 0x1000000) & 0xFF;
		getobjecthandle_packet[14] = (storageID / 0x10000) & 0xFF;
		getobjecthandle_packet[13] = (storageID / 0x100) & 0xFF;
		getobjecthandle_packet[12] = storageID & 0xFF;
		//console.log(getobjecthandle_packet);
		result = await device.transferOut(2, getobjecthandle_packet);  // command 0x1007
	    console.log("GetObjectHandle Request   " + transactionID);

		result = await device.transferIn(1, 512);
	    console.log("GetObjectHandle Data phase");
	    
		let handlerBuffer = new Uint32Array(result.data.buffer);
		//console.log("  received data size = " + handlerBuffer[0]);
		objectNum = handlerBuffer[3];
		console.log("  ObjectHandler number = " + objectNum);
		for (let i=0; i<objectNum; i++) {
			handler[i] = handlerBuffer[i+4];
			console.log("  ObjectHandler" + (i+1) + " = " + handler[i]);
		}
		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("GetObjectHandle OK");
		else console.log("GetObjectHandle FAIL!");


	//=== MTP get object info : contains association type and name ===
		let folderHandle = 0;
		for (let i=0; i<objectNum; i++) {
			transactionID++;
			getobjectinfo1_packet[11] = (transactionID / 0x1000000) & 0xFF;
			getobjectinfo1_packet[10] = (transactionID / 0x10000) & 0xFF;
			getobjectinfo1_packet[9] = (transactionID / 0x100) & 0xFF;
			getobjectinfo1_packet[8] = transactionID & 0xFF;
			getobjectinfo1_packet[15] = (handler[i] / 0x1000000) & 0xFF;
			getobjectinfo1_packet[14] = (handler[i] / 0x10000) & 0xFF;
			getobjectinfo1_packet[13] = (handler[i] / 0x100) & 0xFF;
			getobjectinfo1_packet[12] = handler[i] & 0xFF;
			result = await device.transferOut(2, getobjectinfo1_packet);  // command 0x1007
		    console.log("GetObjectInfo Request   " + transactionID);
			result = await device.transferIn(1, 512);
			let objectBuffer1 = new Uint16Array(result.data.buffer);
			assocType[i] = objectBuffer1[27];
			//console.log("  Association Type " + objectNum  + " = " + assocType[objectNum-1]);
			if (assocType[i] == 1){
				console.log("  This object(" + (i+1) + ") = " + handler[i] + " is a Folder, handle number = " + handler[i]);
				folderHandle = handler[i];
				//i = objectNum;
			} else {
				console.log("  This object(" + (i+1) + ") = " + handler[i] + " is a File data");
				//let parentObj = objectBuffer1[25] + (objectBuffer1[26] * 0x10000);
				//console.log("  Parent Object Handle = " + parentObj);
			}
			result = await device.transferIn(1, 16);
			rescode = new Uint16Array(result.data.buffer);
			if (rescode[3] == 0x2001) 
			    console.log("GetObjectInfo OK");
			else console.log("GetObjectInfo FAIL!");

			testMode = 2;  // next stage is writing end
		}
	}
	ioprocess = 0; // processing flag off
  } catch (err) {
		console.log("no device selected " + result);
		ioprocess = 0; // processing flag off
  }
}
	

async function auth3(testpage) {
  try {
	ioprocess = 1; // processing flag on
	if (testMode == 2) {

	//=== MTP Send Object Info : send Save.txt information ===
		console.log("* Send save.txt for testing *");
		//let filelength = 4; //save.txt file length
		transactionID++;
		sendobjectinfo_packet[11] = (transactionID / 0x1000000) & 0xFF;
		sendobjectinfo_packet[10] = (transactionID / 0x10000) & 0xFF;
		sendobjectinfo_packet[9] = (transactionID / 0x100) & 0xFF;
		sendobjectinfo_packet[8] = transactionID & 0xFF;
		sendobjectinfo_packet[15] = (storageID / 0x1000000) & 0xFF;
		sendobjectinfo_packet[14] = (storageID / 0x10000) & 0xFF;
		sendobjectinfo_packet[13] = (storageID / 0x100) & 0xFF;
		sendobjectinfo_packet[12] = storageID & 0xFF;
		sendobjectinfo_packet[19] = 0;	// Parent object handle = under root folder
		sendobjectinfo_packet[18] = 0;
		sendobjectinfo_packet[17] = 0;
		sendobjectinfo_packet[16] = 0;
		
		sendobjectinfo[11] = (transactionID / 0x1000000) & 0xFF;
		sendobjectinfo[10] = (transactionID / 0x10000) & 0xFF;
		sendobjectinfo[9] = (transactionID / 0x100) & 0xFF;
		sendobjectinfo[8] = transactionID & 0xFF;

		//console.log(sendobjectinfo_packet);
		result = await device.transferOut(2, sendobjectinfo_packet);  // command 0x100C
	    console.log("SendObjectInfo Request   " + transactionID);
		//console.log(sendobjectinfo);
		result = await device.transferOut(2, sendobjectinfo);  // command 0x100C
	    console.log("SendObjectInfo data");		//console.log(sendobjectinfo);

		result = await device.transferIn(1, 24);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("SendObjectInfo OK");
		else console.log("SendObjectInfo FAIL!  " + rescode[3]);


	//=== MTP Send Object : send Save.txt to root ===
		transactionID++;
		sendobject_packet[11] = (transactionID / 0x1000000) & 0xFF;
		sendobject_packet[10] = (transactionID / 0x10000) & 0xFF;
		sendobject_packet[9] = (transactionID / 0x100) & 0xFF;
		sendobject_packet[8] = transactionID & 0xFF;
		
		sendobject_savetxt[11] = (transactionID / 0x1000000) & 0xFF;
		sendobject_savetxt[10] = (transactionID / 0x10000) & 0xFF;
		sendobject_savetxt[9] = (transactionID / 0x100) & 0xFF;
		sendobject_savetxt[8] = transactionID & 0xFF;

		//console.log(sendobject_packet);
		result = await device.transferOut(2, sendobject_packet);  // command 0x100D
	    console.log("SendObject Request   " + transactionID);
		//console.log(sendobject_savetxt);
		result = await device.transferOut(2, sendobject_savetxt);  // command 0x100D
	    console.log("SendObject data");

		result = await device.transferIn(1, 12);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("SendObject OK");
		else console.log("SendObject FAIL!");


	//=== Event read after sending save.txt ===
		result = await device.transferIn(6, 16);
		rescode = new Uint16Array(result.data.buffer);
		let evtcode = rescode[3];
		console.log("  Event code is 0x4007 (" + evtcode + "), object info changed");
		result = await device.transferIn(6, 16);
		rescode = new Uint16Array(result.data.buffer);
		evtcode = rescode[3];
		console.log("  Event code is 0x4003 (" + evtcode + "), object removed");
		result = await device.transferIn(6, 16);
		rescode = new Uint16Array(result.data.buffer);
		evtcode = rescode[3];
		console.log("  Event code is 0x4002 (" + evtcode + "), object added");


	//=== Check updated.txt ===
		let findUpdate = 0;
		let str = ".inkml"; // for testing
		let str2 = "Test1.inkml"; // for testing
		let str1 = "updated.txt"; // for testing

		while (findUpdate < 4) {

	//=== MTP get object handle : contains object handle number ===
			console.log("* Check whether the updated.txt file is created *");
			transactionID++;
			getobjecthandle_packet[11] = (transactionID / 0x1000000) & 0xFF;
			getobjecthandle_packet[10] = (transactionID / 0x10000) & 0xFF;
			getobjecthandle_packet[9] = (transactionID / 0x100) & 0xFF;
			getobjecthandle_packet[8] = transactionID & 0xFF;
			getobjecthandle_packet[15] = (storageID / 0x1000000) & 0xFF;
			getobjecthandle_packet[14] = (storageID / 0x10000) & 0xFF;
			getobjecthandle_packet[13] = (storageID / 0x100) & 0xFF;
			getobjecthandle_packet[12] = storageID & 0xFF;
			result = await device.transferOut(2, getobjecthandle_packet);  // command 0x1007
		    console.log("GetObjectHandle Request   " + transactionID);
			result = await device.transferIn(1, 512);
		    //console.log("GetObjectHandle Data phase");
	    
			let handlerBuffer = new Uint32Array(result.data.buffer);
			//console.log("  received data size = " + handlerBuffer[0]);
			objectNum = handlerBuffer[3];
			console.log("  ObjectHandler number = " + objectNum);
			for (let i=0; i<objectNum; i++) {
				handler[i] = handlerBuffer[i+4];
				console.log("  ObjectHandler" + (i+1) + " = " + handler[i]);
			}
			result = await device.transferIn(1, 16);
			rescode = new Uint16Array(result.data.buffer);
			if (rescode[3] == 0x2001) 
			    console.log("GetObjectHandle OK");
			else console.log("GetObjectHandle FAIL!");
		

	//=== MTP get object info : contains association type and name ===
			for (let i=0; i<objectNum; i++) {
				transactionID++;
				getobjectinfo1_packet[11] = (transactionID / 0x1000000) & 0xFF;
				getobjectinfo1_packet[10] = (transactionID / 0x10000) & 0xFF;
				getobjectinfo1_packet[9] = (transactionID / 0x100) & 0xFF;
				getobjectinfo1_packet[8] = transactionID & 0xFF;
				getobjectinfo1_packet[15] = (handler[i] / 0x1000000) & 0xFF;
				getobjectinfo1_packet[14] = (handler[i] / 0x10000) & 0xFF;
				getobjectinfo1_packet[13] = (handler[i] / 0x100) & 0xFF;
				getobjectinfo1_packet[12] = handler[i] & 0xFF;
				result = await device.transferOut(2, getobjectinfo1_packet);  // command 0x1007
			    console.log("GetObjectInfo Request   " + transactionID);
				result = await device.transferIn(1, 512);
				let objectBuffer1 = new Uint16Array(result.data.buffer);
				assocType[i] = objectBuffer1[27];
				//console.log("  Association Type " + objectNum  + " = " + assocType[objectNum-1]);
				if (assocType[i] == 1){
					console.log("  This object(" + (i+1) + ") = " + handler[i] + " is a Folder");
				} else {
					console.log("  This object(" + (i+1) + ") = " + handler[i] + " is a File data");
					let parentObj = objectBuffer1[25] + (objectBuffer1[26] * 0x10000);
					console.log("  Parent Object Handle = " + parentObj);
					fileSize[i] = (objectBuffer1[11] * 0x10000 + objectBuffer1[10]);
					objectBuffer1 = new Uint8Array(result.data.buffer);
					filenameSize[i] = objectBuffer1[64];
					console.log("  File size = " + fileSize[i]);

					for (let j=0; j < filenameSize[i]; j++){
						filenameBuffer[j] = objectBuffer1[65 + j*2];
						filenameBuffer[j+1] = 0;
						filenameBuffer[j+2] = 0;
					}
					var text_decoder = new TextDecoder("utf-8");
					fileName = text_decoder.decode(Uint8Array.from(filenameBuffer).buffer);
					console.log("  File name of ObjectHandler" + (i+1) + " = " + fileName);
					if (fileName.indexOf(str) >= 0) {  // find ".inkml" string matched
					//if (parentObj == 1) {
						delinkmlHandle = handler[i];
						savefilesize = fileSize[i];
						console.log("  find .inkml file");
					}
					if (!fileName.indexOf(str1)) {
						findUpdate = 4;  // loop end
						console.log("  find updated.txt");
						updateHandle = handler[i];
					}
				}
				
				result = await device.transferIn(1, 16);
				rescode = new Uint16Array(result.data.buffer);
				if (rescode[3] == 0x2001) 
				    console.log("GetObjectInfo OK");
				else console.log("GetObjectInfo FAIL!");
			}
			//poling update check
			if (findUpdate < 4) {	// if the updated.txt is not found, retry 3 times.
				const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
				await _sleep(300);
				console.log("  wait 0.3 seconds " + findUpdate);
			}
			findUpdate = findUpdate +1;

		}
		console.log("  updated.txt handler = " + updateHandle);


	//=== MTP get Inkml object : "Test1.inkml" fro testing ===
		console.log("* Read Test1.inkml for testing *");
		transactionID++;
		getobject_packet[11] = (transactionID / 0x1000000) & 0xFF;
		getobject_packet[10] = (transactionID / 0x10000) & 0xFF;
		getobject_packet[9] = (transactionID / 0x100) & 0xFF;
		getobject_packet[8] = transactionID & 0xFF;
		getobject_packet[15] = (delinkmlHandle / 0x1000000) & 0xFF;
		getobject_packet[14] = (delinkmlHandle / 0x10000) & 0xFF;
		getobject_packet[13] = (delinkmlHandle / 0x100) & 0xFF;
		getobject_packet[12] = delinkmlHandle & 0xFF;
		//console.log(getobject_packet);
		result = await device.transferOut(2, getobject_packet);  // command 0x1007
	    console.log("GetObject Request   " + transactionID);
	    
		result = await device.transferIn(1, (savefilesize+12));  // file get
		//console.log(result.data.buffer); 
		let objectBuffer2 = new Uint8Array(result.data.buffer);
		//console.log(objectBuffer2);
		console.log("  File size = " + savefilesize);
		// Get file content
		//let fileContentBuffer = [];
		for (let j=0; j < savefilesize; j++){
			fileContentBuffer[j] = objectBuffer2[12 + j];
		}
		text_decoder = new TextDecoder("utf-8");
		fileContent = text_decoder.decode(Uint8Array.from(fileContentBuffer).buffer);
		filelength = fileContent.length;					// get inkml file size
		fcon[testpage] = fileContent;
		//console.log(filelength);	// Save file size
		//console.log(fileContent);	// Save file content

		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("GetObject OK");
		else console.log("GetObject FAIL!");


	//=== MTP delete object : delete objects are "Test1.inkml" and "updated.txt" ===
		transactionID++;
		deleteobject[11] = (transactionID / 0x1000000) & 0xFF;
		deleteobject[10] = (transactionID / 0x10000) & 0xFF;
		deleteobject[9] = (transactionID / 0x100) & 0xFF;
		deleteobject[8] = transactionID & 0xFF;
		deleteobject[15] = (delinkmlHandle / 0x1000000) & 0xFF;
		deleteobject[14] = (delinkmlHandle / 0x10000) & 0xFF;
		deleteobject[13] = (delinkmlHandle / 0x100) & 0xFF;
		deleteobject[12] = delinkmlHandle & 0xFF;
		//console.log(deleteobject);
		result = await device.transferOut(2, deleteobject);  // command 0x1008
	    console.log("DeleteObject of Inkml Request   " + transactionID);
		console.log("  delete handle = " + delinkmlHandle);
		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("DeleteObject OK");
		else console.log("DeleteObject FAIL!");

		transactionID++;
		deleteobject[11] = (transactionID / 0x1000000) & 0xFF;
		deleteobject[10] = (transactionID / 0x10000) & 0xFF;
		deleteobject[9] = (transactionID / 0x100) & 0xFF;
		deleteobject[8] = transactionID & 0xFF;
		deleteobject[15] = (updateHandle / 0x1000000) & 0xFF;
		deleteobject[14] = (updateHandle / 0x10000) & 0xFF;
		deleteobject[13] = (updateHandle / 0x100) & 0xFF;
		deleteobject[12] = updateHandle & 0xFF;
		//console.log(deleteobject);
		result = await device.transferOut(2, deleteobject);  // command 0x1008
	    console.log("DeleteObject of Updated.txt Request   " + transactionID);
		console.log("  delete handle = " + updateHandle);
		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("DeleteObject OK");
		else console.log("DeleteObject FAIL!");


	//=== MTP get object handle : contains object handle number ===
		console.log("* Check current existing file *");
		transactionID++;
		getobjecthandle_packet[11] = (transactionID / 0x1000000) & 0xFF;
		getobjecthandle_packet[10] = (transactionID / 0x10000) & 0xFF;
		getobjecthandle_packet[9] = (transactionID / 0x100) & 0xFF;
		getobjecthandle_packet[8] = transactionID & 0xFF;
		getobjecthandle_packet[15] = (storageID / 0x1000000) & 0xFF;
		getobjecthandle_packet[14] = (storageID / 0x10000) & 0xFF;
		getobjecthandle_packet[13] = (storageID / 0x100) & 0xFF;
		getobjecthandle_packet[12] = storageID & 0xFF;
		result = await device.transferOut(2, getobjecthandle_packet);  // command 0x1007
	    console.log("GetObjectHandle Request   " + transactionID);
		result = await device.transferIn(1, 512);
	    console.log("GetObjectHandle Data phase");
	    
		let handlerBuffer1 = new Uint32Array(result.data.buffer);
		//console.log("  received data size = " + handlerBuffer1[0]);
		objectNum = handlerBuffer1[3];
		console.log("  ObjectHandler number = " + objectNum);
		for (let i=0; i<objectNum; i++) {
			handler[i] = handlerBuffer1[i+4];
			console.log("  ObjectHandler" + (i+1) + " = " + handler[i]);
		}
		result = await device.transferIn(1, 16);
		rescode = new Uint16Array(result.data.buffer);
		if (rescode[3] == 0x2001) 
		    console.log("GetObjectHandle OK");
		else console.log("GetObjectHandle FAIL!");

		// test ---
		//sendinkmlinfo[73] = 50;
		testMode = 1; // test end
		console.log("* ready for send inkml data *");
		//---------
	}
	ioprocess = 0; // processing flag off
		//await device.close();
		//console.log("device closed ");
    } catch (err) {
		console.log("no device selected " + result);
		ioprocess = 0; // processing flag off
  }
}

// ------------------------------- fetch test ------
async function auth4() {
  try {
	const formData = new FormData();
	const fileField = document.querySelector('input[type="file"]');

	formData.append('username', 'abc123');
	formData.append('avatar', fileField.files[0]);
	
	fetch('https://edq-wacom-web.zombie.jp/avatar', {
			method: 'PUT',
  			body: formData
		})
		.then((response) => response.json())
 		.then((result) => {
    		console.log('Success:', result);
		})
  		.catch((error) => {
    		console.error('Error:', error);
  		});

  	} catch (err) {
		console.log("no device selected " + err);
  	}
}
// ----------------------------------------------------

function dateUpdate(offset) {
	const today = new Date();
	let datebuffer = new TextEncoder();
	const year = datebuffer.encode(today.getFullYear());
	let mm = today.getMonth();
	const month = datebuffer.encode(mm+1);
	let dd = today.getDate();
	const date = datebuffer.encode(dd);
	let hh = today.getHours();
	const hour = datebuffer.encode(hh);
	let mi = today.getMinutes();
	const minutes = datebuffer.encode(mi);
	let ss = today.getSeconds();
	const seconds = datebuffer.encode(ss);
	//console.log("Year " + year + " month " + month + " date " + date + " hour " + hour + " min " + minutes + " sec " + seconds);
	sendinkmlinfo[offset] = year[0];
	sendinkmlinfo[offset+2] = year[1];
	sendinkmlinfo[offset+4] = year[2];
	sendinkmlinfo[offset+6] = year[3];
	sendinkmlinfo[offset+37] = year[0];
	sendinkmlinfo[offset+39] = year[1];
	sendinkmlinfo[offset+41] = year[2];
	sendinkmlinfo[offset+43] = year[3];
	if (mm < 9 ) {
		sendinkmlinfo[offset+8] = 48;
		sendinkmlinfo[offset+10] = month[0];
		sendinkmlinfo[offset+45] = 48;
		sendinkmlinfo[offset+47] = month[0];
	} else {
		sendinkmlinfo[offset+8] = month[0];
		sendinkmlinfo[offset+10] = month[1];
		sendinkmlinfo[offset+45] = month[0];
		sendinkmlinfo[offset+47] = month[1];
	}
	if (dd < 10) {
		sendinkmlinfo[offset+12] = 48;
		sendinkmlinfo[offset+14] = date[0];
		sendinkmlinfo[offset+49] = 48;
		sendinkmlinfo[offset+51] = date[0];
	} else {	
		sendinkmlinfo[offset+12] = date[0];
		sendinkmlinfo[offset+14] = date[1];
		sendinkmlinfo[offset+49] = date[0];
		sendinkmlinfo[offset+51] = date[1];
	}
	if (hh < 10) {
		sendinkmlinfo[offset+18] = 48;
		sendinkmlinfo[offset+20] = hour[0];
		sendinkmlinfo[offset+55] = 48;
		sendinkmlinfo[offset+57] = hour[0];
	} else {
		sendinkmlinfo[offset+18] = hour[0];
		sendinkmlinfo[offset+20] = hour[1];
		sendinkmlinfo[offset+55] = hour[0];
		sendinkmlinfo[offset+57] = hour[1];
	}
	if (mi < 10) {
		sendinkmlinfo[offset+22] = 48;
		sendinkmlinfo[offset+24] = minutes[0];
		sendinkmlinfo[offset+59] = 48;
		sendinkmlinfo[offset+61] = minutes[0];
	} else {
		sendinkmlinfo[offset+22] = minutes[0];
		sendinkmlinfo[offset+24] = minutes[1];
		sendinkmlinfo[offset+59] = minutes[0];
		sendinkmlinfo[offset+61] = minutes[1];
	}
	if (ss < 10) {
		sendinkmlinfo[offset+26] = 48;
		sendinkmlinfo[offset+28] = seconds[0];
		sendinkmlinfo[offset+63] = 48;
		sendinkmlinfo[offset+65] = seconds[0];
	} else {
		sendinkmlinfo[offset+26] = seconds[0];
		sendinkmlinfo[offset+28] = seconds[1];
		sendinkmlinfo[offset+63] = seconds[0];
		sendinkmlinfo[offset+65] = seconds[1];
	}
	//console.log(sendinkmlinfo);
}

