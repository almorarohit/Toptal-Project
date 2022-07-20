import { LightningElement, api,track,wire } from 'lwc';
import fetchSpecalizations from '@salesforce/apex/FindAndCreateAppointmentsController.fetchSpecalizations';
import checkPhysicianAvailability from '@salesforce/apex/FindAndCreateAppointmentsController.checkPhysicianAvailability';
import handleAfterSave from '@salesforce/apex/FindAndCreateAppointmentsController.handleAfterSave';
import requestCalendarAccess from '@salesforce/apex/FindAndCreateAppointmentsController.requestCalendarAccess';
import backgroundUrl from '@salesforce/resourceUrl/Medical_Image';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import NAME_FIELD from '@salesforce/schema/Appointment__c.Name';
import PATIENT_FIELD from '@salesforce/schema/Appointment__c.Patient__c';
import PHYSICIAN_FIELD from '@salesforce/schema/Appointment__c.Physician__c';
import NOTES_FIELD from '@salesforce/schema/Appointment__c.Notes__c';    
import START_FIELD from '@salesforce/schema/Appointment__c.Start_Time__c';
import END_FIELD from '@salesforce/schema/Appointment__c.End_Time__c';

export default class FindAndCreateAppointments extends LightningElement {
    @track spclzValue = 'Cardiology';
    @track spclzValueName = 'Cardiology';
    @track spclzOptions;
    @track spclzData;
    @track priceSelected;
    @track isSpclzSelected=false;
    @track startTime='';
    @track endTime='';
    @track physData;
    @track isCreateAppointment = false;
    @track physicianId;

    appFields = [NAME_FIELD, PATIENT_FIELD, PHYSICIAN_FIELD,NOTES_FIELD,START_FIELD,END_FIELD];

    connectedCallback(){
        fetchSpecalizations()
        .then(data => {
            if(data!=null){
                let options = [];
                 this.spclzData = data;
                for (var key in data) {
                    options.push({ label: data[key].Name, value: data[key].Id  });
                }
                this.spclzOptions = options;
            }

        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error!!', 
                message: error.message, 
                variant: 'error'
            }),);
        });
   }   

    handleSpclzChange(event) {
        this.spclzValue = event.detail.value;
        for (var key in this.spclzData) {
            if(this.spclzData[key].Id==event.detail.value){
                this.priceSelected = this.spclzData[key].Appointment_Price__c;
                this.isSpclzSelected = true;
                this.spclzValueName = this.spclzData[key].Name;
            };
        }
    }
    handleStartChange(event) {
        this.startTime = event.detail.value;
    }
    handleEndChange(event) {
        this.endTime = event.detail.value;
    }

    checkAvailability() {
        this.physData = '';
        checkPhysicianAvailability({d1 : this.startTime,d2:this.endTime,medSpclzId:this.spclzValue})
        .then(data => {
            if(data!=null){
                 this.physData = data;
            }
            console.log(data);
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error!!', 
                message: error.message, 
                variant: 'error'
            }),);
        });
    }

    createAppointment(event) {
        console.log(event.target.id);
        this.isCreateAppointment = true;
        let str = event.target.id;
        this.physicianId = str.substr(0,str.indexOf("-"));
        console.log(str.substr(0,str.indexOf("-")));
       
    }

    requestCalendarAccess(event) {
        let str = event.target.id;
        this.physicianId = str.substr(0,str.indexOf("-"));
        requestCalendarAccess({physicianId : this.physicianId})
        .then(data => {
            const evt = new ShowToastEvent({
                title: 'Email Sent!',
                message: 'An email has been sent to physician for calendar access request. This may take few days.',
                variant: 'success',
            });
            this.dispatchEvent(evt);
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error!!', 
                message: error.message, 
                variant: 'error'
            }),);
        });
    }

    handleSuccess(event) {

        handleAfterSave({appId : event.detail.id})
        .then(data => {
            const evt = new ShowToastEvent({
                title: 'Appointment created',
                message: 'Record ID: ' + event.detail.id,
                variant: 'success',
            });
            this.dispatchEvent(evt);
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error!!', 
                message: error.message, 
                variant: 'error'
            }),);
        });

        
        this.isCreateAppointment = false;
    }

    closeModal() {
        this.isCreateAppointment = false;
    }
    submitDetails() {
        this.isCreateAppointment = false;
    }

    get backgroundStyle() {
        return ` background-repeat: no-repeat !important; 
        background-position: center center !important;
        background-size: cover !important;
        position: absolute !important;
        width: 100%;height:100%;
        overflow: hidden;background-image:url(${backgroundUrl})`;
    }
}