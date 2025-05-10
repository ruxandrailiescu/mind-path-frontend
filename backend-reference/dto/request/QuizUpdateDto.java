package ro.ase.acs.mind_path.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuizUpdateDto {
    private String title;
    private String status;

    public boolean isEmpty() {
        return title == null && status == null;
    }
}
