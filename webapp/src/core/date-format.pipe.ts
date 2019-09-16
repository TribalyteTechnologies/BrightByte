import { Pipe, PipeTransform } from "@angular/core";
import { DatePipe } from "@angular/common";

@Pipe({
  name: "dateFormat"
})
export class DateFormatPipe extends DatePipe implements PipeTransform {
    public transform(value: any, args?: any): any {
        return super.transform(value, "dd/MM/yyyy HH:mm");
    }
}
